import rss from "@astrojs/rss";
import { fetchBookmarks } from "@api/obsidian-bookmarks";

export async function GET(context) {
    const bookmarks = await fetchBookmarks();

    const lastUpdated =
        bookmarks.length > 0 ? new Date(bookmarks[0].created) : new Date();

    return rss({
        title: "钟长华 - 书签",
        description: "钟长华收藏的精选书签",
        site: context.site,
        xmlns: {
            atom: "http://www.w3.org/2005/Atom",
        },
        items: bookmarks.map((bookmark) => ({
            title: bookmark.title,
            pubDate: new Date(bookmark.created),
            link: bookmark.link,
            description:
                bookmark.tags.length > 0
                    ? `标签: ${bookmark.tags.join(", ")}`
                    : "",
        })),
        customData: `<language>en-us</language>
<managingEditor>3527320768@qq.com (钟长华)</managingEditor>
<lastBuildDate>${lastUpdated.toUTCString()}</lastBuildDate>
<atom:link href="${new URL("bookmarks-rss.xml", context.site).href}" rel="self" type="application/rss+xml" />`,
    });
}
