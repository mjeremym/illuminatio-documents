import {themes as prismThemes} from 'prism-react-renderer';

const siteUrl = process.env.DOCS_SITE_URL || 'https://docs.illuminatio.digital';
const baseUrl = process.env.DOCS_BASE_URL || '/';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Illuminatio Documentation',
  tagline: 'Architecture, services, APIs and operations for the Illuminatio platform',
  favicon: 'illuminatio-mark.png',
  url: siteUrl,
  baseUrl,
  organizationName: 'mjeremym',
  projectName: 'illuminatio-documents',
  trailingSlash: false,
  onBrokenAnchors: 'throw',
  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  staticDirectories: ['static', '../images'],
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
        {to: '/docs/platform/overview/system-overview', label: 'Start here', position: 'left'},
        {to: '/docs/platform/architecture/design-fundamentals', label: 'Architecture', position: 'left'},
        {to: '/docs/modules', label: 'Modules', position: 'left'},
        {to: '/docs/platform/architecture/service-composition-and-development', label: 'Build & deploy', position: 'left'},
        {to: '/docs/platform/api', label: 'APIs', position: 'left'},
        {to: '/javadoc', label: 'Javadoc', position: 'left'},
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
            {label: 'Design fundamentals', to: '/docs/platform/architecture/design-fundamentals'},
            {label: 'Processing, rules and workflows', to: '/docs/platform/architecture/processing-rules-workflows'},
            {label: 'Build applications', to: '/docs/platform/architecture/service-composition-and-development'},
            {label: 'Module catalogue', to: '/docs/modules'},
            {label: 'Deployment topologies', to: '/docs/platform/operations/deployment-topologies'},
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
      copyright: `Copyright © ${new Date().getFullYear()} Attatae Ltd. Illuminatio is proprietary software.`,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    prism: {
      // Keep examples visually distinct from the light documentation canvas in both modes.
      theme: prismThemes.dracula,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'bash', 'json', 'yaml', 'graphql'],
    },
  },
};

export default config;
