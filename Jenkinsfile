pipeline {
    agent any

    environment {
        GITHUB_CREDENTIALS = credentials('github-pat')
        
        NODE_ENV = 'production'
        NEXT_TELEMETRY_DISABLED = '1'
        
        DEPLOY_SERVER = '192.168.1.145'
        DEPLOY_DIR = '/var/www/compliance.nbs.co.zw'
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
            steps {nodeJSInstallationName: 'Node23'
                nodejs(nodeJSInstallationName: 'Node23') {
                    sh 'npm install'
                }
            }
        }
        stage('Check Node') {
    steps {
        sh 'node -v'
        sh 'npm -v'
    }
}


        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: 'Node23') {
                    sh 'npm run build'
                }
                
                archiveArtifacts artifacts: '.next/**/*, public/**/*, package*.json', fingerprint: true
            }
        }


        stage('Deploy') {
            steps {
                echo "Deploying to ${env.DEPLOY_SERVER}:${env.DEPLOY_DIR}"
                
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
                                        pm2 restart compliance-app || pm2 start npm --name "compliance-app" -- start
                                    """
                                )
                            ]
                        )
                    ]
                )
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
