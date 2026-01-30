pipeline {
  agent any
  environment {
    IMAGE_NAME = 'sample_gitops_web'
    // Dùng commit SHA làm tag (rút ngắn 7 ký tự)
    IMAGE_TAG = env.GIT_COMMIT?.take(7) ?: 'latest'
    HARBOR_HOST = 'harbor.localhost'  // hoặc IP/domain Harbor của bạn
    HARBOR_PROJECT = 'library'
  }
  stages {
    stage('Build') {
      steps {
        script {
          docker.build("${HARBOR_HOST}/${HARBOR_PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}")
        }
      }
    }
    stage('Push to Harbor') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'harbor-credentials', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
          sh "echo \$HARBOR_PASS | docker login ${HARBOR_HOST} -u \$HARBOR_USER --password-stdin"
          sh "docker push ${HARBOR_HOST}/${HARBOR_PROJECT}/${IMAGE_NAME}:${IMAGE_TAG}"
        }
      }
    }
  }
}