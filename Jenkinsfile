pipeline {
  agent any
  environment {
    IMAGE_NAME = 'sample_gitops_web'
    HARBOR_HOST = 'harbor-core.harbor.svc.cluster.local'
    HARBOR_PROJECT = 'library'
    // Ingress ClusterIP để pod resolve harbor.localhost → token URL (có thể override bằng INGRESS_CLUSTER_IP trong Jenkins)
    INGRESS_IP = env.INGRESS_CLUSTER_IP ?: '10.96.16.102'
  }
  stages {
    stage('Build and Push (Kaniko)') {
      steps {
        script {
          env.IMAGE_TAG = env.GIT_COMMIT?.take(7) ?: 'latest'
          def imageFull = "${env.HARBOR_HOST}/${env.HARBOR_PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
          podTemplate(yaml: """
apiVersion: v1
kind: Pod
spec:
  hostAliases:
  - ip: "${env.INGRESS_IP}"
    hostnames:
    - harbor.localhost
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:v1.6.0-debug
    command: ["sleep", "99d"]
    tty: true
""") {
            node(POD_LABEL) {
              checkout scm
              withCredentials([usernamePassword(credentialsId: 'harbor-credentials', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
                sh """
                  mkdir -p .docker
                  AUTH=\$(echo -n "\${HARBOR_USER}:\${HARBOR_PASS}" | base64 | tr -d '\\\\n')
                  echo "{\\"auths\\":{\\"http://${env.HARBOR_HOST}\\":{\\"auth\\":\\"\$AUTH\\"},\\"https://harbor.localhost\\":{\\"auth\\":\\"\$AUTH\\"}}}" > .docker/config.json
                """
                container('kaniko') {
                  sh "export DOCKER_CONFIG=\${WORKSPACE}/.docker && /kaniko/executor -f \${WORKSPACE}/Dockerfile -c \${WORKSPACE} --insecure --skip-tls-verify --destination=${imageFull}"
                }
              }
            }
          }
        }
      }
    }
  }
}
