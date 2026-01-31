pipeline {
  agent any
  environment {
    IMAGE_NAME = 'sample_gitops_web'
    HARBOR_HOST = 'harbor.hoangvu75.space'
    HARBOR_PROJECT = 'library'
    MANIFEST_REPO = 'https://github.com/Hoangvu75/k8s_manifest.git'
    VALUES_PATH = 'apps/playground/sample-gitops-web/chart/values.yaml'
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

    stage('Update Manifest (GitOps)') {
      steps {
        script {
          withCredentials([usernamePassword(credentialsId: 'github-credentials', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
            sh """
              rm -rf k8s_manifest || true
              REPO_URL=\$(echo "${env.MANIFEST_REPO}" | sed "s|https://|https://\\${GIT_USER}:\\${GIT_TOKEN}@|")
              git clone \$REPO_URL k8s_manifest
              cd k8s_manifest
              sed -i 's/tag: ".*"/tag: "${env.IMAGE_TAG}"/' ${env.VALUES_PATH}
              git config user.email "jenkins@ci.local"
              git config user.name "Jenkins CI"
              git add ${env.VALUES_PATH}
              git commit -m "chore: update ${env.IMAGE_NAME} image tag to ${env.IMAGE_TAG}" || echo "No changes to commit"
              git push origin master
            """
          }
        }
      }
    }
    stage('Cleanup Old Images (Harbor)') {
      steps {
        script {
          withCredentials([usernamePassword(credentialsId: 'harbor-credentials', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
            sh '''
              KEEP_COUNT=2
              API_URL="https://${HARBOR_HOST}/api/v2.0/projects/${HARBOR_PROJECT}/repositories/${IMAGE_NAME}/artifacts"
              
              # Get all artifacts sorted by push_time desc (parse digest with grep/sed)
              RESPONSE=$(curl -s -u "${HARBOR_USER}:${HARBOR_PASS}" "${API_URL}?page_size=100&sort=-push_time")
              ARTIFACTS=$(echo "$RESPONSE" | grep -o '"digest":"sha256:[^"]*"' | sed 's/"digest":"//g' | sed 's/"//g')
              
              # Count and delete old ones
              COUNT=0
              for DIGEST in $ARTIFACTS; do
                COUNT=$((COUNT + 1))
                if [ $COUNT -gt $KEEP_COUNT ]; then
                  echo "Deleting old artifact: $DIGEST"
                  curl -s -X DELETE -u "${HARBOR_USER}:${HARBOR_PASS}" "${API_URL}/${DIGEST}" || true
                fi
              done
              
              echo "Cleanup complete. Kept $KEEP_COUNT most recent images."
            '''
          }
        }
      }
    }
  }
}

