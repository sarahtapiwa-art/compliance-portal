pipeline {
    agent any
    
    environment {
        // GitHub credentials
        GITHUB_CREDENTIALS = credentials('github-token')
        
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
                // Checkout code from GitHub
                git(
                    url: 'git@github.com:National-Building-Society/compliance-portal.git',
                    credentialsId: 'github-ssh-key',
                    branch: 'main'
                )
                
                // Store Git commit info
                script {
                    env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                // Use Node.js environment
                nodejs(nodeJSInstallationName: 'NodeJS') {
                    // Install dependencies
                    sh 'npm ci --prefer-offline'
                    
                    // Or if using yarn:
                    // sh 'yarn install --frozen-lockfile'
                }
            }
        }
        
        stage('Lint and Test') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS') {
                    // Run linting
                    sh 'npm run lint || true'  // Continue even if lint fails
                    
                    // Run tests
                    sh 'npm test -- --passWithNoTests || true'
                }
            }
        }
        
        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: 'NodeJS') {
                    // Build the Next.js application
                    sh 'npm run build'
                }
                
                // Archive artifacts
                archiveArtifacts artifacts: '.next/**/*, public/**/*, package*.json', fingerprint: true
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    // Choose deployment method based on your setup
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
            // Clean up workspace
            cleanWs()
            
            // Send notifications
            // script {
            //     if (currentBuild.result == 'SUCCESS') {
            //         slackSend(color: 'good', message: "Build ${env.JOB_NAME} #${env.BUILD_NUMBER} succeeded!")
            //     } else if (currentBuild.result == 'FAILURE') {
            //         slackSend(color: 'danger', message: "Build ${env.JOB_NAME} #${env.BUILD_NUMBER} failed!")
            //     }
            // }
        }
    }
}

// Deployment functions
def deployToStaging() {
    echo 'Deploying to staging environment...'
    
    // Example: Deploy via SSH
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
    
    // Example: Deploy to Vercel (if using)
    // sh 'npx vercel --prod --token=$VERCEL_TOKEN'
    
    // Or deploy via SSH
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
