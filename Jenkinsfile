pipeline {
  agent any
  environment {
    IMAGE_NAME = 'sample_gitops_web'
    HARBOR_HOST = 'harbor.localhost'
    HARBOR_PROJECT = 'library'
  }
  stages {
    stage('Prepare') {
      steps {
        sh '''
          if ! command -v docker 2>/dev/null; then
            echo "Docker not found, attempting to install..."
            if command -v apt-get 2>/dev/null; then
              apt-get update -qq && apt-get install -y -qq docker.io 2>/dev/null || \
              (sudo apt-get update -qq && sudo apt-get install -y -qq docker.io) 2>/dev/null || true
            elif command -v apk 2>/dev/null; then
              apk add --no-cache docker-cli 2>/dev/null || \
              (sudo apk add --no-cache docker-cli) 2>/dev/null || true
            fi
          fi
          command -v docker && docker --version || { echo "ERROR: Docker not available. Use an agent with Docker or Kaniko."; exit 1; }
        '''
      }
    }
    stage('Build') {
      steps {
        script {
          env.IMAGE_TAG = env.GIT_COMMIT?.take(7) ?: 'latest'
          def imageFull = "${env.HARBOR_HOST}/${env.HARBOR_PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
          sh "docker build -t ${imageFull} ."
        }
      }
    }
    stage('Push to Harbor') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'harbor-credentials', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
          sh "echo \$HARBOR_PASS | docker login ${env.HARBOR_HOST} -u \$HARBOR_USER --password-stdin"
          sh "docker push ${env.HARBOR_HOST}/${env.HARBOR_PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
        }
      }
    }
    stage('Clean up') {
      steps {
        sh "docker rmi ${env.HARBOR_HOST}/${env.HARBOR_PROJECT}/${env.IMAGE_NAME}:${env.IMAGE_TAG} || true"
      }
    }
  }
}