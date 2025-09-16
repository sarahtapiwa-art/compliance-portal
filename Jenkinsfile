pipeline {
    agent any
    environment {
        REPO_URL = 'https://github.com/National-Building-Society/compliance-portal.git'
        DEPLOY_SERVER = 'deployment-server' // Use the Jenkins config name
        DEPLOY_DIR = '/var/www/compliance.nbs.co.zw'
        NODE_ENV = 'production'
        NEXT_TELEMETRY_DISABLED = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    extensions: [],
                    userRemoteConfigs: [[
                        credentialsId: 'github-pat',
                        url: env.REPO_URL
                    ]]
                ])
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci --prefer-offline'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sshPublisher(
                        publishers: [
                            sshPublisherDesc(
                                configName: env.DEPLOY_SERVER,
                                transfers: [
                                    sshTransfer(
                                        sourceFiles: '**/*',
                                        removePrefix: '',
                                        remoteDirectory: env.DEPLOY_DIR,
                                        execCommand: """
                                            cd ${env.DEPLOY_DIR}
                                            npm ci --production
                                            pm2 stop compliance-app || true
                                            pm2 start npm --name "compliance-app" -- start
                                        """
                                    )
                                ]
                            )
                        ]
                    )
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    cleanWs()
                } catch (Exception e) {
                    echo "Workspace cleanup failed: ${e.message}"
                }
            }
        }
        success {
            echo 'Build and deployment completed successfully! 🎉'
        }
        failure {
            echo 'Build or deployment failed. Please check logs. ❌'
        }
    }
}