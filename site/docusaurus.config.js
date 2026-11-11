import {themes as prismThemes} from 'prism-react-renderer';

const siteUrl = process.env.DOCS_SITE_URL || 'https://docs.illuminatio.digital';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Illuminatio Documentation',
  tagline: 'Architecture, services, APIs and operations for the Illuminatio platform',
  favicon: 'illuminatio-mark.png',
  url: siteUrl,
  baseUrl: '/',
  organizationName: 'mjeremym',
  projectName: 'illuminatio-documents',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  staticDirectories: ['../images'],
  presets: [
    [
      'classic',
      {
        docs: {
          path: '.generated/docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.js',
          showLastUpdateAuthor: false,
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],
  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
        docsRouteBasePath: '/docs',
        docsDir: '.generated/docs',
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],
  themeConfig: {
    image: 'illuminatio-mark.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Illuminatio',
      logo: {
        alt: 'Illuminatio mark',
        src: 'illuminatio-mark.png',
      },
      items: [
        {to: '/docs/platform/overview/system-overview', label: 'Overview', position: 'left'},
        {to: '/docs/modules', label: 'Modules', position: 'left'},
        {to: '/docs/platform/api', label: 'APIs', position: 'left'},
        {href: '/javadoc/', label: 'Javadoc', position: 'left'},
        {
          href: 'https://github.com/mjeremym/illuminatio-parent',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {label: 'System overview', to: '/docs/platform/overview/system-overview'},
            {label: 'Architecture', to: '/docs/platform/architecture'},
            {label: 'Operations', to: '/docs/platform/operations/deployment-environments'},
          ],
        },
        {
          title: 'Source',
          items: [
            {label: 'Parent repository', href: 'https://github.com/mjeremym/illuminatio-parent'},
            {label: 'Documents repository', href: 'https://github.com/mjeremym/illuminatio-documents'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Jeremy Miller. Proprietary.`,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'bash', 'json', 'yaml', 'graphql'],
    },
  },
};

export default config;
