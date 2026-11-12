import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import javadocManifest from '../generated/javadoc-manifest.json';

export default function JavadocIndex() {
  const javadocBaseUrl = useBaseUrl('/javadoc/');

  return (
    <Layout title="Javadoc" description="Generated Illuminatio Java API documentation">
      <main className="container margin-vert--xl">
        <Heading as="h1">Illuminatio Javadoc</Heading>
        <p>
          Generated module Java API documentation. Each page is staged from the Maven build; fix
          descriptions in Java source rather than editing generated HTML.
        </p>
        <p>
          Use the <Link to="/docs/platform/api">API reference catalogue</Link> for REST/OpenAPI,
          GraphQL and gRPC documentation, or the{' '}
          <Link to="/docs/platform/api/using-apis-with-insomnia">Insomnia guide</Link> for tested
          access patterns.
        </p>

        <Heading as="h2">Modules</Heading>
        <p>
          Published {javadocManifest.publishedCount} of {javadocManifest.expectedCount} Java module
          references from this documentation snapshot.
        </p>
        <ul>
          {javadocManifest.modules.map((module) => (
            <li key={module.name}>
              <a href={`${javadocBaseUrl}${module.name}/`}><code>{module.name}</code></a>
            </li>
          ))}
        </ul>

        {javadocManifest.unavailable.length > 0 && (
          <>
            <Heading as="h2">Unavailable in this local snapshot</Heading>
            <p>Run the reactor Javadoc build before creating a release image.</p>
            <ul>
              {javadocManifest.unavailable.map((module) => (
                <li key={module.name}><code>{module.name}</code> — {module.reason}</li>
              ))}
            </ul>
          </>
        )}
      </main>
    </Layout>
  );
}
