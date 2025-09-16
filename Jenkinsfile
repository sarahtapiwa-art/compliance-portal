pipeline {
    agent any

    environment {
        REPO_URL = 'https://github.com/National-Building-Society/compliance-portal.git'
        DEPLOY_SERVER = '192.168.1.145'
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
                sh 'node -v'
                sh 'npm -v'
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
                    archiveArtifacts artifacts: '.next/**/*, public/**/*, package*.json', fingerprint: true

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
            cleanWs()
        }
    }
}
