# Sample GitOps Web

Repo **source code** (Next.js) dùng để học luồng GitOps:

1. **Jenkins** build image từ repo này và push lên **Harbor**.
2. **Jenkins** cập nhật image/tag trong repo **k8s_manifest**.
3. **Argo CD** scan k8s_manifest → pull image từ Harbor và deploy lên K8s.

---

## Chạy local

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

---

## Build production

```bash
npm run build
npm start
```

---

## Build Docker image

```bash
docker build -t sample-gitops-web:latest .
docker run -p 3000:3000 sample-gitops-web:latest
```

Sau khi cấu hình Harbor:

```bash
docker tag sample-gitops-web:latest harbor.localhost/library/sample-gitops-web:latest
docker push harbor.localhost/library/sample-gitops-web:latest
```

---

## Tech

- **Next.js 14** (App Router)
- **TypeScript**
- **output: standalone** cho Docker (chạy `node server.js`)
