pipeline {
    agent any

    environment {
        // GitHub credentials
        GITHUB_CREDENTIALS = credentials('github-pat')
        
        // Build environment
        NODE_ENV = 'production'
        NEXT_TELEMETRY_DISABLED = '1'
        
        // Deployment server (if using SSH)
        DEPLOY_SERVER = 'your-server-alias'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                git(
                    url: 'https://github.com/National-Building-Society/compliance-portal.git',
                    branch: 'main',
                    credentialsId: 'github-pat'
                )

                script {
                    env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'node -v'
                sh 'npm ci --prefer-offline'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                
                // Archive artifacts
                archiveArtifacts artifacts: '.next/**/*, public/**/*, package*.json', fingerprint: true
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (params.DEPLOY_TO_STAGING) {
                        deployToStaging()
                    } else if (params.DEPLOY_TO_PRODUCTION) {
                        deployToProduction()
                    } else {
                        echo 'Build completed successfully. Deployment skipped.'
                    }
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

// Deployment functions
def deployToStaging() {
    echo 'Deploying to staging environment...'
    
    sshPublisher(
        publishers: [
            sshPublisherDesc(
                configName: env.DEPLOY_SERVER,
                transfers: [
                    sshTransfer(
                        sourceFiles: '**/*',
                        removePrefix: '',
                        remoteDirectory: '/var/www/staging',
                        execCommand: '''
                            cd /var/www/staging
                            npm ci --production
                            pm2 restart staging-app || pm2 start npm --name "staging-app" -- start
                        '''
                    )
                ]
            )
        ]
    )
}

def deployToProduction() {
    echo 'Deploying to production environment...'
    
    sshPublisher(
        publishers: [
            sshPublisherDesc(
                configName: env.DEPLOY_SERVER,
                transfers: [
                    sshTransfer(
                        sourceFiles: '**/*',
                        removePrefix: '',
                        remoteDirectory: '/var/www/production',
                        execCommand: '''
                            cd /var/www/production
                            npm ci --production
                            pm2 restart production-app || pm2 start npm --name "production-app" -- start
                        '''
                    )
                ]
            )
        ]
    )
}
