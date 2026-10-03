// Sätteri hast plugin: gives h2 and h3 in legal Markdown a stable id and a
// visible "link to this section" anchor. Runs before Astro's own heading-ids
// plugin, which keeps any id already set, so the table of contents and the
// anchors agree.
import GithubSlugger from 'github-slugger';

export function headingAnchors() {
  return () => {
    const slugger = new GithubSlugger();
    return {
      name: 'el-heading-anchors',
      element: {
        filter: ['h2', 'h3'],
        visit(node, ctx) {
          const text = ctx.textContent(node).trim();
          const existing = node.properties?.id;
          const id = typeof existing === 'string' ? existing : slugger.slug(text);
          if (typeof existing !== 'string') ctx.setProperty(node, 'id', id);
          ctx.appendChild(node, {
            type: 'element',
            tagName: 'a',
            properties: { className: ['anchor'], href: `#${id}`, ariaLabel: `Link to this section: ${text}` },
            children: [],
          });
        },
      },
    };
  };
}
