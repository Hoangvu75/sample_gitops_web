import HostDisplay from "./HostDisplay";

export default function Home() {
  return (
    <div className="container">
      <header>
        <h1>Sample GitOps Web</h1>
        <p className="tagline">Trang mẫu Next.js để học luồng GitOps</p>
      </header>

      <main>
        <section className="flow">
          <h2>Luồng GitOps (dự kiến)</h2>
          <ol className="steps">
            <li>
              <strong>Jenkins</strong> build image từ source (repo này) và push lên{" "}
              <strong>Harbor</strong>.
            </li>
            <li>
              <strong>Jenkins</strong> cập nhật tag image trong repo{" "}
              <strong>k8s_manifest</strong> (deployment / values).
            </li>
            <li>
              <strong>Argo CD</strong> scan k8s_manifest → pull image từ Harbor và
              deploy lên cluster.
            </li>
          </ol>
        </section>

        <section className="info">
          <p>Nếu bạn đang thấy trang này trên cluster, nghĩa là luồng đã chạy thành công.</p>
          <p className="meta">
            Host: <HostDisplay />
          </p>
        </section>

        <section className="terminal-link" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a
            href="/terminal"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#6b8afd',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            🖥️ Open Kubectl Terminal
          </a>
        </section>
      </main>

      <footer>
        <p>sample_gitops_web · Next.js · Build → Harbor → Argo CD</p>
      </footer>
    </div>
  );
}
