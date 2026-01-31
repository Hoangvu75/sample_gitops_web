pipeline {
  agent any
  environment {
    IMAGE_NAME = 'sample_gitops_web'
    HARBOR_HOST = 'harbor.hoangvu75.space'
    HARBOR_PROJECT = 'library'
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
  containers:
  - name: kaniko
    image: gcr.io/kaniko-project/executor:v1.23.0-debug
    command: ["sleep", "99d"]
    tty: true
""") {
            node(POD_LABEL) {
              checkout scm
              withCredentials([usernamePassword(credentialsId: 'harbor-credentials', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
                sh """
                  mkdir -p .docker
                  AUTH=\$(echo -n "\${HARBOR_USER}:\${HARBOR_PASS}" | base64 | tr -d '\\\\n')
                  echo '{"auths":{"https://${env.HARBOR_HOST}":{"auth":"'\$AUTH'"}}}' > .docker/config.json
                """
                container('kaniko') {
                  sh "export DOCKER_CONFIG=\${WORKSPACE}/.docker && /kaniko/executor -f \${WORKSPACE}/Dockerfile -c \${WORKSPACE} --destination=${imageFull}"
                }
              }
            }
          }
        }
      }
    }
  }
}
