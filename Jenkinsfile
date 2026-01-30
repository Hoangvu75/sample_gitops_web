pipeline {
  agent any
  environment {
    IMAGE_NAME = 'sample_gitops_web'
    HARBOR_HOST = 'harbor-core.harbor.svc.cluster.local'
    HARBOR_PROJECT = 'library'
  }
  stages {
    stage('Get Ingress IP') {
      steps {
        script {
          try {
            env.INGRESS_IP = sh(
              script: "kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.spec.clusterIP}'",
              returnStdout: true
            ).trim()
            if (!env.INGRESS_IP) env.INGRESS_IP = '10.96.16.102'
          } catch (Exception e) {
            echo "Error getting Ingress IP: ${e}"
            env.INGRESS_IP = '10.96.16.102'
          }
          echo "Ingress IP for harbor.localhost: ${env.INGRESS_IP}"
        }
      }
    }
    stage('Build and Push (Kaniko)') {
      steps {
        script {
          env.IMAGE_TAG = env.GIT_COMMIT?.take(7) ?: 'latest'
          def imageFull = "${env.HARBOR_HOST}/${env.HARBOR_PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
          def ingressIp = env.INGRESS_IP ?: '10.96.16.102'
          podTemplate(yaml: """
apiVersion: v1
kind: Pod
spec:
  hostAliases:
  - ip: "${ingressIp}"
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
