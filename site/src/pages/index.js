import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const routes = [
  {
    title: 'Understand the platform',
    text: 'Start with the system overview, capability map and shared domain language.',
    to: '/docs/platform/overview/system-overview',
  },
  {
    title: 'Build and integrate',
    text: 'Use the architecture standards, module guide and generated API references.',
    to: '/docs/platform/architecture/module-development-guide',
  },
  {
    title: 'Operate Illuminatio',
    text: 'Find environment, deployment, configuration, observability and recovery guidance.',
    to: '/docs/platform/operations/deployment-environments',
  },
];

export default function Home() {
  return (
    <Layout title="Home" description="Illuminatio platform documentation">
      <main>
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>ILLUMINATIO PLATFORM</p>
            <Heading as="h1">Documentation that follows the code</Heading>
            <p className={styles.lead}>
              Architecture, service ownership, APIs and operational guidance assembled from the
              repositories that own them.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/platform/overview/system-overview">
                Start with the overview
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/modules">
                Browse modules
              </Link>
            </div>
          </div>
        </section>
        <section className={styles.routes}>
          <div className="container">
            <div className="row">
              {routes.map((route) => (
                <div className="col col--4" key={route.title}>
                  <Link className={styles.card} to={route.to}>
                    <Heading as="h2">{route.title}</Heading>
                    <p>{route.text}</p>
                    <span>Open guide →</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
