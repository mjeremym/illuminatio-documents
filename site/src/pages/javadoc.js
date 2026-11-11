import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

export default function JavadocIndex() {
  return (
    <Layout title="Javadoc" description="Generated Illuminatio Java API documentation">
      <main className="container margin-vert--xl">
        <Heading as="h1">Illuminatio Javadoc</Heading>
        <p>
          Module Javadoc will be published here as modules adopt the documentation build and pass
          doclint. Generated HTML is produced from the same source revision recorded by this site.
        </p>
        <p>
          Until then, use the <Link to="/docs/platform/api">API reference catalogue</Link> for
          OpenAPI, GraphQL and gRPC references.
        </p>
      </main>
    </Layout>
  );
}
