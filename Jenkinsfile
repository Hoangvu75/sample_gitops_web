pipeline {
  agent any
  environment {
    IMAGE_NAME = 'sample_gitops_web'
    HARBOR_HOST = 'harbor.localhost'
    HARBOR_PROJECT = 'library'
  }
  stages {
    stage('Build') {
      steps {
        script {
          env.IMAGE_TAG = env.GIT_COMMIT?.take(7) ?: 'latest'
          docker.build("${HARBOR_HOST}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.IMAGE_TAG}")
        }
      }
    }
    stage('Push to Harbor') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'harbor-credentials', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
          sh "echo \$HARBOR_PASS | docker login ${HARBOR_HOST} -u \$HARBOR_USER --password-stdin"
          sh "docker push ${HARBOR_HOST}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.IMAGE_TAG}"
        }
      }
    }
    stage('Clean up') {
      steps {
        sh "docker rmi ${HARBOR_HOST}/${HARBOR_PROJECT}/${IMAGE_NAME}:${env.IMAGE_TAG}"
      }
    }
  }
}