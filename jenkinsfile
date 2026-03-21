pipeline {
    agent any
    
    tools {
        nodejs 'node20.9.0'
    }

    
    stages {

        stage('Install') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Prisma Setup') {
    environment {
        DATABASE_URL = 'postgresql://postgres:postgres@postgres:5432/mydb'
    }
    steps {
        sh '''
        npx prisma generate
        npx prisma db push
        '''
    }
}


        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Sonar Scan') {
            steps {
                withSonarQubeEnv('sonar') {
                    sh 'npx sonar-scanner -Dsonar.projectKey=Todo-Backend -Dsonar.sources=./src'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES')  {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
