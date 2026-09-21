#!/usr/bin/env python3
"""
Blog static-site generator for Everest.

Builds the blog from markdown files in content/blog/, in the Everest design.
The archive is /blog/ and individual posts live at /blog/<slug>/.

Sources live under content/ and output under blog/ so the two never collide:
when both shared the blog/ directory the markdown originals would have been
deployed alongside the pages built from them.

The rest of the site is hand-built static HTML and is left untouched; this
script only writes under blog/.

Future-dated posts (NZ time) and drafts are excluded from all output, which is
the scheduling mechanism: a post dated in the future sits dormant until a rebuild
picks it up on its date.

Run at build time (vercel.json buildCommand) BEFORE tools/generate.js, which then
regenerates sitemap.xml + llms.txt and picks up the generated post pages.
"""
import os, re, json, html, datetime
from pathlib import Path

import yaml
import markdown as md
from jinja2 import Environment, FileSystemLoader, select_autoescape

try:
    from zoneinfo import ZoneInfo
    NZ = ZoneInfo("Pacific/Auckland")
except Exception:  # pragma: no cover
    NZ = datetime.timezone(datetime.timedelta(hours=12))

ROOT = Path(__file__).parent.parent.resolve()
SITE = os.environ.get("SITE_URL", "https://everest-personal-training-sooty.vercel.app").rstrip("/")
BRAND = "Everest"
DEFAULT_OG = SITE + "/assets/img/og-default.jpg"
POSTS_PER_PAGE = 1000  # effectively no pagination

env = Environment(
    loader=FileSystemLoader(str(ROOT)),
    autoescape=select_autoescape(["html", "xml"]),
    trim_blocks=False, lstrip_blocks=False,
)


def slugify(value):
    value = re.sub(r"[^\w\s-]", "", str(value).lower()).strip()
    return re.sub(r"[\s_]+", "-", value)


env.filters["slugify"] = slugify
TODAY = datetime.datetime.now(NZ).date()


# ---------------------------------------------------------------- posts
def parse_post(path):
    raw = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.S)
    if not m:
        raise ValueError(f"{path.name}: missing YAML frontmatter")
    meta = yaml.safe_load(m.group(1)) or {}
    body_md = m.group(2)

    for req in ("title", "date", "slug", "excerpt"):
        if not meta.get(req):
            raise ValueError(f"{path.name}: missing required field '{req}'")

    # smart_dashes OFF so no en/em dashes are ever generated (public copy stays dash-free)
    body_html = md.markdown(body_md, extensions=["extra", "sane_lists", "smarty", "toc"],
                            extension_configs={"smarty": {"smart_dashes": False}})
    words = len(re.findall(r"\w+", re.sub(r"<[^>]+>", " ", body_html)))
    date = datetime.date.fromisoformat(str(meta["date"]))

    faq = []
    for item in (meta.get("faq") or []):
        q = (item.get("q") or item.get("question") or "").strip()
        a = (item.get("a") or item.get("answer") or "").strip()
        if q and a:
            faq.append({"q": q, "a": a})

    # Optional recipe block. Normalised here so the schema builder can assume
    # lists rather than re-checking YAML shapes.
    recipe = meta.get("recipe") or {}
    if recipe:
        recipe = dict(recipe)
        for key in ("ingredients", "method"):
            val = recipe.get(key)
            recipe[key] = [str(x).strip() for x in val if str(x).strip()] if isinstance(val, list) else []

    # How the featured image is used. "figure" renders it full and legible in
    # the article body; "hero" burns it into the darkened header behind the
    # title. Default is figure because hero destroys anything containing text,
    # and most of what Everest publishes is diagrams and infographics.
    image_style = (meta.get("image_style") or "figure").strip().lower()
    if image_style not in ("figure", "hero"):
        image_style = "figure"

    slug = slugify(meta["slug"])
    return {
        "recipe": recipe,
        "image_style": image_style,
        "title": meta["title"],
        # Shown in search results and browser tabs. Falls back to title.
        "seo_title": (meta.get("seo_title") or "").strip(),
        "date": date.isoformat(),
        "date_obj": date,
        "date_display": date.strftime("%-d %B %Y"),
        "slug": slug,
        "excerpt": meta["excerpt"],
        "summary": (meta.get("summary") or "").strip(),
        "featured_image": (meta.get("featured_image") or "").strip(),
        "author": meta.get("author") or "Everest",
        "tags": meta.get("tags") or [],
        "faq": faq,
        "draft": bool(meta.get("draft", False)),
        "published": meta.get("published", None),
        "read_time": max(1, round(words / 200)),
        "body_html": body_html,
        "url": f"/blog/{slug}/",
        "og_image": (meta.get("featured_image") or "").strip() or DEFAULT_OG,
    }


def is_live(post):
    if post["draft"]:
        return False
    if post["published"] is False:
        return False
    if post["published"] is True:
        return True
    return post["date_obj"] <= TODAY  # future-dated posts stay dormant


def load_posts():
    posts = []
    blog_dir = ROOT / "content" / "blog"
    if blog_dir.exists():
        for p in sorted(blog_dir.glob("*.md")):
            # skip the readme and any _underscore-prefixed template
            if p.name.lower() == "readme.md" or p.name.startswith("_"):
                continue
            posts.append(parse_post(p))
    live = [p for p in posts if is_live(p)]
    live.sort(key=lambda p: p["date"], reverse=True)
    return live


def write(rel_path, content):
    out = ROOT / rel_path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(content, encoding="utf-8")
    return out


def og_abs(path):
    return path if path.startswith("http") else SITE + path


# ---------------------------------------------------------------- schema
def post_jsonld(post):
    blogposting = {
        "@type": "BlogPosting",
        "headline": post["title"],
        "description": post["excerpt"],
        "datePublished": post["date"],
        "dateModified": post["date"],
        "author": {"@type": "Person", "name": post["author"]},
        "publisher": {"@id": SITE + "/#business"},
        "image": og_abs(post["og_image"]),
        "mainEntityOfPage": {"@type": "WebPage", "@id": SITE + post["url"]},
        "url": SITE + post["url"],
        "isPartOf": {"@id": SITE + "/#website"},
        "inLanguage": "en-NZ",
    }
    graph = [
        blogposting,
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": post["title"], "item": SITE + post["url"]},
        ]},
    ]
    if post["faq"]:
        graph.append({
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": f["q"],
                 "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
                for f in post["faq"]
            ],
        })

    # Recipe posts get Recipe schema on top of the BlogPosting. This is the
    # one content type search engines still give rich results to, and an
    # assistant asked "high protein breakfast" can quote ingredients and
    # method straight out of it. Only emitted when the frontmatter carries
    # both ingredients and method, since a partial Recipe is worse than none.
    r = post["recipe"]
    if r and r.get("ingredients") and r.get("method"):
        recipe = {
            "@type": "Recipe",
            "name": r.get("name") or post["title"],
            "description": r.get("description") or post["excerpt"],
            "author": {"@type": "Person", "name": post["author"]},
            "datePublished": post["date"],
            "image": og_abs(post["og_image"]),
            "recipeIngredient": list(r["ingredients"]),
            "recipeInstructions": [
                {"@type": "HowToStep", "position": i + 1, "text": step}
                for i, step in enumerate(r["method"])
            ],
            "inLanguage": "en-NZ",
        }
        for key, field in (("yield", "recipeYield"), ("category", "recipeCategory"),
                           ("cuisine", "recipeCuisine")):
            if r.get(key):
                recipe[field] = r[key]
        # ISO 8601 durations, e.g. prep_time: PT15M
        for key, field in (("prep_time", "prepTime"), ("cook_time", "cookTime"),
                           ("total_time", "totalTime")):
            if r.get(key):
                recipe[field] = r[key]
        if r.get("nutrition"):
            n = {"@type": "NutritionInformation"}
            for key, field in (("calories", "calories"), ("protein", "proteinContent"),
                               ("carbs", "carbohydrateContent"), ("fat", "fatContent")):
                if r["nutrition"].get(key):
                    n[field] = r["nutrition"][key]
            recipe["nutrition"] = n
        graph.append(recipe)

    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


# ---------------------------------------------------------------- build
def build_posts(posts):
    tmpl = env.get_template("templates/blog_post.html")
    for i, post in enumerate(posts):
        related = [p for p in posts if p["slug"] != post["slug"]][:3]
        write(f"blog/{post['slug']}/index.html", tmpl.render(
            post=post, related=related,
            page_title=f"{post['seo_title'] or post['title']} | {BRAND}",
            page_description=post["excerpt"],
            canonical=SITE + post["url"],
            og_title=post["title"], og_image=og_abs(post["og_image"]),
            jsonld=post_jsonld(post),
        ))


def build_archive(posts):
    tmpl = env.get_template("templates/blog_archive.html")
    write("blog/index.html", tmpl.render(
        posts=posts,
        page_title="Blog | Training, Nutrition &amp; Recipes | Everest",
        page_description="Recipes, training guides and evidence-led articles on strength, movement and human performance from Everest's Christchurch coaching team.",
        canonical=SITE + "/blog/", og_image=DEFAULT_OG,
        heading="Practical, evidence-led insights.",
        heading_lead="Articles answering the real questions we hear from the people and organisations we work with across Christchurch and Canterbury.",
        active_tag=None,
    ))


def build_tags(posts):
    tmpl = env.get_template("templates/blog_archive.html")
    tags = {}
    for post in posts:
        for t in post["tags"]:
            tags.setdefault(t, []).append(post)
    for tag, tag_posts in tags.items():
        s = slugify(tag)
        write(f"blog/tag/{s}/index.html", tmpl.render(
            posts=tag_posts, active_tag=tag,
            page_title=f"{tag} | Blog | {BRAND}",
            page_description=f"Everest articles and insights tagged {tag}.",
            canonical=SITE + f"/blog/tag/{s}/", og_image=DEFAULT_OG,
            heading=f"Tagged: {tag}.",
            heading_lead=f"Every Everest article tagged {tag}.",
            noindex=True,
        ))


def build_rss(posts):
    nl = "\n"; items = []
    for post in posts[:30]:
        pub = datetime.datetime.combine(post["date_obj"], datetime.time(8, 0), NZ)
        cats = "".join(f"      <category>{html.escape(t)}</category>{nl}" for t in post["tags"])
        items.append(f"""    <item>
      <title>{html.escape(post['title'])}</title>
      <link>{SITE}{post['url']}</link>
      <guid isPermaLink="true">{SITE}{post['url']}</guid>
      <pubDate>{pub.strftime('%a, %d %b %Y %H:%M:%S %z')}</pubDate>
      <description>{html.escape(post['excerpt'])}</description>
{cats}    </item>""")
    now = datetime.datetime.now(NZ).strftime('%a, %d %b %Y %H:%M:%S %z')
    write("blog/rss.xml", f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Everest Personal Training Blog</title>
    <link>{SITE}/blog/</link>
    <atom:link href="{SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Evidence-led training, strength, fitness and human performance insights from Everest, Christchurch.</description>
    <language>en-nz</language>
    <lastBuildDate>{now}</lastBuildDate>
{chr(10).join(items)}
  </channel>
</rss>
""")


def main():
    posts = load_posts()
    print(f"Blog: building {len(posts)} live post(s) (today={TODAY} NZ)")
    build_posts(posts)
    build_archive(posts)
    build_tags(posts)
    build_rss(posts)
    print("Blog build complete.")


if __name__ == "__main__":
    main()
