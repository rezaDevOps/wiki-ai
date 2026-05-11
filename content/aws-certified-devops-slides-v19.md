---
title: AWS Certified DevOps Engineer Professional Course by Stéphane Maarek
tags: [AWS, DevOps, certification, DOP-C02, CICD, CloudFormation, monitoring, security, IaC]
---

# AWS Certified DevOps Engineer Professional

> **[Image]** Course cover slide with orange gradient background. Shows title "AWS Certified DevOps Engineer Professional By Stéphane Maarek" with the AWS Certified DevOps Engineer Professional hexagonal badge (teal color). Left side shows a circular photo of a smiling young man in a white shirt. Right side shows a document/pencil icon. Two purple buttons at bottom: "COURSE →" and "EXTRA PRACTICE EXAMS".

## Disclaimer: These slides are copyrighted and strictly for personal use only

- This document is reserved for people enrolled into the [AWS Certified DevOps Engineer Professional course by Stephane Maarek](https://links.datacumulus.com/aws-certified-devops-pro-coupon).
- **Please do not share this document**, it is intended for personal use and exam preparation only, thank you.
- If you've obtained these slides for free on a website that is not the course's website, please reach out to piracy@datacumulus.com. Thanks!
- Best of luck for the exam and happy learning!

## Table of Contents

- [Domain 1 – SDLC Automation](#domain-1--sdlc-automation)
- [Domain 2 – Configuration Management and IaC](#domain-2--configuration-management-and-iac)
- [Domain 3 – Resilient Cloud Solutions](#domain-3--resilient-cloud-solutions)
- [Domain 4 – Monitoring and Logging](#domain-4--monitoring-and-logging)
- [Domain 5 – Incident and Event Response](#domain-5--incident-and-event-response)
- [Domain 6 – Security and Compliance](#domain-6--security-and-compliance)
- [Other Services](#other-services)
- [Exam Preparation & Congratulations](#exam-preparation--congratulations)

---

# AWS Certified DevOps Engineer Professional Course

## DOP-C02

---

## Please do not skip this lecture

- **ADVANCED, PROFESSIONAL-LEVEL COURSE**
  - Do the AWS Certified Developer course & certification at a pre-requisite
  - It'll be easier if you do the AWS Certified SysOps course & certification as well
- **EXPERIENCE PREVAILS**
  - The AWS DevOps exam is hard and tests you on real-world experience (min 2 years)
  - Some lectures are re-used from other courses ( [DVA/SOA] tag for example)
- **TAKE YOUR TIME**
  - Practice as much as possible at work
  - Take notes for features or services you didn't know about
- Happy learning, and good luck for your exam!

---

# Domain 1 - SDLC Automation

## CICD – Introduction

- We have learned how to:
  - Create AWS resources, manually (fundamentals)
  - Interact with AWS programmatically (AWS CLI)
  - Deploy code to AWS using Elastic Beanstalk
- All these manual steps make it very likely for us to do mistakes!
- We would like our code "in a repository" and have it deployed onto AWS
  - Automatically
  - The right way
  - Making sure it's tested before being deployed
  - With possibility to go into different stages (dev, test, staging, prod)
  - With manual approval where needed
- To be a proper AWS developer… we need to learn AWS CICD

## CICD – Introduction

- This section is all about automating the deployment we've done so far while adding increased safety
- We'll learn about:
  - **AWS CodeCommit** – storing our code
  - **AWS CodePipeline** – automating our pipeline from code to Elastic Beanstalk
  - **AWS CodeBuild** – building and testing our code
  - **AWS CodeDeploy** – deploying the code to EC2 instances (not Elastic Beanstalk)
  - **AWS CodeStar** – manage software development activities in one place
  - **AWS CodeArtifact** – store, publish, and share software packages
  - **AWS CodeGuru** – automated code reviews using Machine Learning

## Continuous Integration (CI)

- Developers push the code to a code repository often (e.g., GitHub, CodeCommit, Bitbucket…)
- A testing / build server checks the code as soon as it's pushed (CodeBuild, Jenkins CI...)
- The developer gets feedback about the tests and checks that have passed / failed
- Find bugs early, then fix bugs
- Deliver faster as the code is tested
- Deploy often
- Happier developers, as they're unblocked

> **[Image]** Diagram showing CI flow: Developer (with laptop icon) → push code → Code Repository (cloud icon) → fetch code → Build Server (build & test) → Build & test results → back to Developer. A circular arrow icon in top right represents the continuous cycle.

## Continuous Delivery (CD)

- Ensures that the software can be released reliably whenever needed
- Ensures deployments happen often and are quick
- Shift away from "one release every 3 months" to "5 releases a day"
- That usually means automated deployment (e.g., CodeDeploy, Jenkins CD, Spinnaker...)

> **[Image]** CD pipeline diagram: Developer → push code → Code Repository → fetch code → Build Server (build & test) → deploy every passed build → Deployment Server → multiple Application Servers (showing v1 being replaced by v2 on three server pairs). A red circular arrow icon represents continuous delivery.

## Technology Stack for CICD

> **[Image]** CICD technology stack diagram showing the pipeline stages: Code → Build → Test → Deploy → Provision. AWS CodeCommit (blue icon) at Code stage; AWS CodeBuild (blue construction icon) spanning Build and Test; AWS CodeDeploy (blue umbrella icon) at Deploy; AWS Elastic Beanstalk (orange tree icon) at Provision. Alternative options shown below: GitHub/Bitbucket for code repos, Jenkins CI for build servers, EC2 Instances/On-premises/Lambda/ECS for deployment targets. AWS CodePipeline orchestrates all stages at the bottom.

---

## AWS CodeCommit

- **Version control** is the ability to understand the various changes that happened to the code over time (and possibly roll back)
- All these are enabled by using a version control system such as Git
- A Git repository can be synchronized on your computer, but it usually is uploaded on a central online repository
- Benefits are:
  - Collaborate with other developers
  - Make sure the code is backed-up somewhere
  - Make sure it's fully viewable and auditable

### AWS CodeCommit

- Git repositories can be expensive
- The industry includes GitHub, GitLab, Bitbucket...
- And **AWS CodeCommit:**
  - Private Git repositories
  - No size limit on repositories (scale seamlessly)
  - Fully managed, highly available
  - Code only in AWS Cloud account => increased security and compliance
  - Security (encrypted, access control...)
  - Integrated with Jenkins, AWS CodeBuild, and other CI tools

> **[Image]** Diagram showing two developers (Emma and John) both pushing code to a central Code Repository (cloud icon), with a downward arrow labeled "push code".

### CodeCommit – Security

- Interactions are done using Git (standard)
- **Authentication**
  - **SSH Keys** – AWS Users can configure SSH keys in their IAM Console
  - **HTTPS** – with AWS CLI Credential helper or Git Credentials for IAM user
- **Authorization**
  - IAM policies to manage users/roles permissions to repositories
- **Encryption**
  - Repositories are automatically encrypted at rest using AWS KMS
  - Encrypted in transit (can only use HTTPS or SSH – both secure)
- **Cross-account Access**
  - Do NOT share your SSH keys or your AWS credentials
  - Use an IAM Role in your AWS account and use AWS STS (**AssumeRole** API)

### CodeCommit vs. GitHub

| | **CodeCommit** | **GitHub** |
|---|---|---|
| Support Code Review (Pull Requests) | ✓ | ✓ |
| Integration with AWS CodeBuild | ✓ | ✓ |
| Authentication (SSH & HTTPS) | ✓ | ✓ |
| Security | IAM Users & Roles | GitHub Users |
| Hosting | Managed & hosted by AWS | - Hosted by GitHub<br>- GitHub Enterprise: self hosted on your servers |
| UI | Minimal | Fully Featured |

### CodeCommit – Important – Deprecation

- On July 25th 2024, AWS abruptly discontinued CodeCommit
- New customers cannot use the service
- AWS recommends to migrate to an external Git solution

> **[Image]** Shows logos of GitHub (black octocat), GitLab (orange fox), and git (red diamond with "git" text) labeled as "3rd party".

- For this course:
  - CodeCommit might still appear at the exam (for now)
  - Anytime I use CodeCommit, please use GitHub instead (we set it up once together)
  - Every time I mention CodeCommit, assume there's a GitHub integration

### CodeCommit – Monitoring with EventBridge

- You can monitor CodeCommit events in EventBridge (near real-time)
- pullRequestCreated, pullRequestStatusChanged, referenceCreated, commentOnCommitCreated...

> **[Image]** Flow diagram: CodeCommit → (pullRequestCreated event) → EventBridge → triggers to SNS, Lambda, and CodePipeline (with "…" indicating more options).

### Migrate Git Repository to CodeCommit

- You can migrate a project hosted on another Git repository (e.g., Github, GitLab...) to CodeCommit repository

> **[Image]** Migration diagram showing: 1. Create CodeCommit Repository, 2. git clone from Git Server (red diamond icon), then Local Computer (Git Client) gets project files and 3. Push project to CodeCommit Repository.

### CodeCommit – Cross-Region Replication

- **Use case:** achieve lower latency pulls for global developers, backups…

> **[Image]** Architecture diagram showing Developer in us-east-1 pushing to CodeCommit (Repository_A), which triggers a referenceCreated/referenceUpdated event to EventBridge, which invokes an ECS Task that replicates via git clone to CodeCommit (Repository_B) in eu-west-2. EventBridge Event JSON is shown with source "aws.codecommit", detail-type "CodeCommit Repository State Change", referenceType "branch", referenceName "main". Git remote set-url command shown for pushing to eu-west-2 repository.

### CodeCommit – Branch Security

- By default, a user who has push permissions to a CodeCommit repository can contribute to any branch
- Use IAM policies to restrict users to push or merge code to a specific branch
- Example: only senior developers can push to production branch
- **Note:** Resource Policy is not supported yet

> **[Image]** Diagram showing CodeCommit Repository with Production (blue), Staging (orange), and Develop (green) branches. Senior Developer can push/merge (with a blocked symbol on Production), Junior Developers can access Staging and Develop. An IAM Policy JSON is shown with Effect "Deny", Actions including codecommit:GitPush, codecommit:DeleteBranch, codecommit:MergeBranchesByFastForward, etc., with Condition StringEqualsIfExists on codecommit:References for refs/heads/main and refs/heads/prod.

### CodeCommit – Pull Request Approval Rules

- Helps ensure the quality of your code by requiring user(s) to approve the open PRs before the code can be merged
- Specify a **pool of users** to approve and **number of users** who must approve the PR
- Specify IAM Principal ARN (IAM users, federated users, IAM Roles, IAM Groups)
- **Approval Rule Templates**
  - Automatically apply Approval Rules to PRs in specific repositories
  - Example: define different rules for dev and prod branches

> **[Image]** Diagram showing a pool of 5 users (Required: 2) with 2 checkmarks indicating approvals, then a checkmark on the Pull Request flowing down to the CodeCommit Repository.

---

## AWS CodePipeline

- Visual Workflow to orchestrate your CICD
- **Source** – CodeCommit, ECR, S3, Bitbucket, GitHub
- **Build** – CodeBuild, Jenkins, CloudBees, TeamCity
- **Test** – CodeBuild, AWS Device Farm, 3rd party tools...
- **Deploy** – CodeDeploy, Elastic Beanstalk, CloudFormation, ECS, S3...
- **Invoke** – Lambda, Step Functions
- Consists of stages:
  - Each stage can have sequential actions and/or parallel actions
  - Example: Build → Test → Deploy → Load Testing → …
  - Manual approval can be defined at any stage

### CodePipeline – Artifacts

- Each pipeline stage can create artifacts
- Artifacts stored in an S3 bucket and passed on to the next stage

> **[Image]** AWS CodePipeline diagram showing: Developer pushes code → AWS CodeCommit (Source) produces output artifacts → S3 Bucket (central storage) → AWS CodeBuild (Build) takes input/output artifacts → AWS CodeDeploy (Deploy) takes input artifacts and deploys.

### CodePipeline – Troubleshooting

- For CodePipeline Pipeline/Action/Stage Execution State Changes
- Use **CloudWatch Events (Amazon EventBridge)**. Example:
  - You can create events for failed pipelines
  - You can create events for cancelled stages
- If CodePipeline fails a stage, your pipeline stops, and you can get information in the console
- If pipeline can't perform an action, make sure the "IAM Service Role" attached does have enough IAM permissions (IAM Policy)
- AWS CloudTrail can be used to audit AWS API calls

### CodePipeline – Events vs. Webhooks vs. Polling

> **[Image]** Three-part diagram:
> **Events** (top-left): CodeCommit → EventBridge → (trigger) → CodePipeline
> **Webhooks** (top-right): Script → (HTTP Webhook) → CodePipeline
> **Polling** (bottom-right): CodePipeline → (regular checks with timer icon) → GitHub
> Also shown: GitHub → CodeStar Source Connection (GitHub App) → (trigger) → CodePipeline
> Note at bottom: "Events are the default and recommended"

### CodePipeline – Action Types Constraints for Artifacts

- **Owner**
  - **AWS** – for AWS services
  - **3rd Party** – GitHub or Alexa Skills Kit
  - **Custom** – Jenkins
- **Action Type**
  - **Source** – S3, ECR, GitHub...
  - **Build** – CodeBuild, Jenkins
  - **Test** – CodeBuild, Device Farm, Jenkins
  - **Approval** – Manual
  - **Invoke** – Lambda, Step Functions
  - **Deploy** – S3, CloudFormation, CodeDeploy, Elastic Beanstalk, ECS, Service Catalog...

| **Owner** | **Action Type** | **Provider** | **Valid Number of Input Artifacts** | **Valid Number of Output Artifacts** |
|---|---|---|---|---|
| AWS | Source | S3 | 0 | 1 |
| AWS | Source | CodeCommit | 0 | 1 |
| AWS | Source | ECR | 0 | 1 |
| 3rd Party | Source | GitHub | 0 | 1 |
| AWS | Build | Codebuild | 1 to 5 | 0 to 5 |
| AWS | Test | CodeBuild | 1 to 5 | 0 to 5 |
| AWS | Test | Device Farm | 1 | 0 |
| AWS | Approval | Manual | 0 | 0 |
| AWS | Deploy | S3 | 1 | 0 |
| AWS | Deploy | CloudFormation | 0 to 10 | 0 to 1 |
| AWS | Deploy | CodeDeploy | 1 | 0 |
| AWS | Deploy | Elastic Beanstalk | 1 | 0 |
| AWS | Deploy | ECS | 1 | 0 |
| AWS | Deploy | Service Catalog | 1 | 0 |
| AWS | Invoke | Lambda | 0 to 5 | 0 to 5 |
| AWS | Invoke | Step Functions | 0 to 1 | 0 to 1 |
| 3rd Party | Deploy | Alexa Skills Kit | 1 to 2 | 0 |
| Custom | Build | Jenkins | 0 to 5 | 0 to 5 |
| Custom | Test | Jenkins | 0 to 5 | 0 to 5 |
| Custom | Any Suggested Category | Specified in Custom Action | 0 to 5 | |

### CodePipeline – Manual Approval Stage

> **[Image]** Pipeline diagram showing: CodeCommit → CodeBuild → (trigger) → Manual Approval → (deploy) → CodeDeploy. An SNS notification triggers and sends email to an IAM User. IAM User Permissions JSON is shown with two statements: one allowing codepipeline:GetPipeline* on the pipeline ARN, and another allowing codepipeline:PutApprovalResult on the approval action ARN.

### CodePipeline – CloudFormation as a Target

- **CloudFormation Deploy Action** can be used to deploy AWS resources
- Example: deploy Lambda functions using CDK or SAM (alternative to CodeDeploy)
- Works with CloudFormation StackSets to deploy across multiple AWS accounts and AWS Regions
- Configure different settings:
  - Stack name, Change Set name, template, parameters, IAM Role, Action Mode...

> **[Image]** CodePipeline with stages: CodeCommit → CloudFormation (Create Change Set) → Manual Approval → CloudFormation (Execute Change Set). Shows a template flowing from CodeCommit.

### CodePipeline – CloudFormation Integration

- **CREATE_UPDATE** – create or update an existing stack
- **DELETE_ONLY** – delete a stack if it exists

> **[Image]** CodePipeline diagram with stages: CodeBuild (Build app) → CloudFormation (Deploy Infra & app) [CREATE_UPDATE] → CodeBuild (Test app) → CloudFormation (Delete Test Infra) [DELETE_ONLY] → CloudFormation (Deploy Prod Infra) [CREATE_UPDATE] → Production. Shows a CloudFormation Stack containing ALB and Auto Scaling Group that gets created then deleted after testing.

### CodePipeline – CloudFormation as a Target

- **Action Modes**
  - Create or Replace a Change Set, Execute a Change Set
  - Create or Update a Stack, Delete a Stack, Replace a Failed Stack
- **Template Parameter Overrides**
  - Specify a JSON object to override parameter values
  - Retrieves the parameter value from CodePipeline Input Artifact
  - All parameter names must be present in the template
  - **Static** – use template configuration file (recommended)
  - **Dynamic** – use parameter overrides

> **[Image]** JSON snippet showing parameter override using Fn::GetParam function to retrieve ParamName parameter value from CodePipeline input artifact config-file-name.json.

### CodePipeline – Best Practices

> **[Image]** Three pipeline pattern diagrams:
> 1. "One CodePipeline, One CodeDeploy, Parallel deploy to multiple Deployment Groups": CodePipeline → CodeDeploy → Deployment Group A / Deployment Group B / ...
> 2. "Parallel Actions using in a Stage using RunOrder": CodePipeline with CodeCommit feeding two parallel CodeBuild actions in the same stage
> 3. "Deploy to Pre-Prod before Deploying to Prod": CodePipeline with CodeCommit → CodeDeploy (Pre-Prod) → Manual Approve → CodeDeploy (Prod)

### CodePipeline & EventBridge

- **EventBridge** – detect and react to changes in execution states (e.g., intercept failures at certain stages)

> **[Image]** CodePipeline diagram with CodeCommit → CodeBuild (failed) → CodeDeploy. A CodePipeline Event triggers EventBridge which both triggers SNS (to notify User) and invokes Lambda (to diagnose code).

### CodePipeline – Invoke Action

- **Lambda** – invokes a Lambda function within a Pipeline
- **Step Functions** – starts a State Machine within a Pipeline

> **[Image]** Two diagrams:
> 1. Lambda invoke: CodePipeline → invoke → Lambda → call → REST API
> 2. Step Functions: CodePipeline with CodeCommit → CodeBuild → invoke → Step Functions → start → CodeBuild → deploy → CodeDeploy. Step Functions also: PutItem → DynamoDB Table, Start Task → ECS Task (perform load testing), GetItem → DynamoDB Table

### CodePipeline – Multi Region

- Actions in your pipeline can be in different regions
- Example: deploy a Lambda function through CloudFormation into multiple regions
- S3 Artifact Stores must be defined in each region where you have actions
  - CodePipeline must have read/write access into every artifact buckets
  - If you use the console default artifact buckets are configured, else you must create them
- CodePipeline handles the copying of input artifacts from one AWS Region to the other Regions when performing cross-region actions
- In your cross-region actions, only reference the name of the input artifacts

> **[Image]** Table showing Artifact store with Region (eu-west-1, eu-central-1), Type (S3, S3), and Location (codepipeline-eu-west-1-460886087071, codepipeline-eu-central-1-625328630265).

### CodePipeline – CloudFormation Multi Region

> **[Image]** Pipeline diagram with eu-west-1 region at top and us-east-2 at bottom. CodeCommit → CodeBuild → two parallel CloudFormation deployments: one to Lambda (eu-west-1) using template-eu-west-1.yaml from eu-west-1 Artifact Store, and one to Lambda (us-east-2) using template-us-east-2.yaml from us-east-2 Artifact Store. CodePipeline copies input artifacts between regions.

---

## AWS CodeBuild

- A fully managed continuous integration (CI) service
- Continuous scaling (no servers to manage or provision – no build queue)
- Compile source code, run tests, produce software packages...
- Alternative to other build tools (e.g., Jenkins)
- Charged per minute for compute resources (time it takes to complete the builds)
- Leverages Docker under the hood for reproducible builds
- Use prepackaged Docker images or create your own custom Docker image
- **Security:**
  - Integration with KMS for encryption of build artifacts
  - IAM for CodeBuild permissions, and VPC for network security
  - AWS CloudTrail for API calls logging

### AWS CodeBuild

- **Source** – CodeCommit, S3, Bitbucket, GitHub
- **Build instructions:** Code file **buildspec.yml** or insert manually in Console
- **Output logs** can be stored in Amazon S3 & CloudWatch Logs
- Use CloudWatch Metrics to monitor build statistics
- Use EventBridge to detect failed builds and trigger notifications
- Use CloudWatch Alarms to notify if you need "thresholds" for failures
- Build Projects can be defined within CodePipeline or CodeBuild

### CodeBuild – Supported Environments

- Java
- Ruby
- Python
- Go
- Node.js
- Android
- .NET Core
- PHP
- Docker – extend any environment you like

### CodeBuild – How it Works

> **[Image]** Architecture diagram: CodeCommit (Source) with Source code + buildspec.yml → CodeBuild container running instructions from buildspec.yml → S3 Bucket (artifacts). An optional S3 Bucket (Cache) stores/retrieves reusable pieces. Docker Image (Prepackaged or Custom) feeds into CodeBuild. Output logs go to Amazon S3 and CloudWatch Logs.

### CodeBuild – buildspec.yml

- `buildspec.yml` file must be at the **root** of your code
- `env` – define environment variables
  - **variables** – plaintext variables
  - **parameter-store** – variables stored in SSM Parameter Store
  - **secrets-manager** – variables stored in AWS Secrets Manager
- `phases` – specify commands to run:
  - **install** – install dependencies you may need for your build
  - **pre_build** – final commands to execute before build
  - **Build** – actual build commands
  - **post_build** – finishing touches (e.g., zip output)
- `artifacts` – what to upload to S3 (encrypted with KMS)
- `cache` – files to cache (usually dependencies) to S3 for future build speedup

> **[Image]** Sample buildspec.yml code showing version: 0.2, env section with variables (JAVA_HOME) and parameter-store (LOGIN_PASSWORD), phases with install (apt-get update/install maven), pre_build (docker login), build (mvn install), post_build sections, artifacts section with target/messageUtil-1.0.jar, and cache paths with /root/.m2/**/*.

### CodeBuild – Local Build

- In case of need of deep troubleshooting beyond logs…
- You can run CodeBuild locally on your desktop (after installing Docker)
- For this, leverage the CodeBuild Agent
- https://docs.aws.amazon.com/codebuild/latest/userguide/use-codebuild-agent.html

### CodeBuild – Inside VPC

- By default, your CodeBuild containers are launched outside your VPC
  - It cannot access resources in a VPC
- You can specify a VPC configuration:
  - VPC ID
  - Subnet IDs
  - Security Group IDs
- Then your build can access resources in your VPC (e.g., RDS, ElastiCache, EC2, ALB...)
- Use cases: integration tests, data query, internal load balancers...

> **[Image]** VPC diagram showing Private Subnet with CodeBuild Container connected to an Amazon RDS DB Instance inside the VPC.

### CodeBuild – Environment Variables

- **Default Environment Variables**
  - Defined and provided by AWS
  - AWS_DEFAULT_REGION, CODEBUILD_BUILD_ARN, CODEBUILD_BUILD_ID, CODEBUILD_BUILD_IMAGE...
- **Custom Environment Variables**
  - **Static** – defined at build time (override using start-build API call)
  - **Dynamic** – using SSM Parameter Store and Secrets Manager

> **[Image]** CodeBuild Project Environment Variables table showing: AWS_DEFAULT_REGION (eu-west-2) as Default, ENVIRONMENT (Production) as Custom (Static), SECRET_TOKEN (MY_SECRET_TOKEN) as Custom (Dynamic). Secrets Manager and Parameter Store (MY_SECRET_TOKEN) icons shown on the left.

### CodeBuild – Security

- **CodeBuild Service Role** allows CodeBuild to access AWS resources on your behalf (assign the required permissions)
- **Use cases:**
  - Download code from CodeCommit repository
  - Fetch parameters from SSM Parameter Store
  - Upload build artifacts to S3 bucket
  - Fetch secrets from Secrets Manager
  - Store logs in CloudWatch Logs
- In-transit and at-rest data encryption (cache, logs...)
- Build output artifact encryption (requires access to KMS)

> **[Image]** Diagram: CodeBuild → (via Service Role) → CodeCommit (download code), Parameter Store (fetch), S3 Bucket (upload artifacts).

### CodeBuild – Build Badges

- Dynamically generated badge that displays the status of the latest build
- Can be accessed through a public URL for your CodeBuild project
- Supported for **CodeCommit, GitHub, and BitBucket**
- **Note:** Badges are available at the branch level

> **[Image]** Two pull request screenshots showing "AWS CodeBuild passing" badge (green) and "AWS CodeBuild failing" badge (red) in comment sections of a CodeCommit PR.

### CodeBuild – Triggers

> **[Image]** Three trigger diagrams:
> 1. CodeCommit → (event) → EventBridge → (trigger) → CodeBuild
> 2. CodeCommit → (event) → EventBridge → (trigger) → Lambda → (trigger) → CodeBuild
> 3. GitHub → (event) → Web Hook → (trigger) → CodeBuild

### CodeBuild – Validate Pull Requests

- Validate proposed code changes in PRs before they get merged
- Ensure high level of code quality and avoid code conflicts

> **[Image]** Flow diagram: Developer creates/updates Pull Request on CodeCommit Repository (with Production and Develop branches). pullRequestCreated/pullRequestSourceBranchUpdated event triggers EventBridge → Lambda Function (updates PR with "Test Build Begin" comment) + CodeBuild. CodeBuild success/failure event → EventBridge → Lambda Function (updates PR with "Build Outcome" comment).

> **[Image]** Two side-by-side screenshots of pull request comments showing "AWS CodeBuild failing" (Build Failed) and "AWS CodeBuild passing" (Build Success) with build start timestamps.

### CodeBuild – Test Reports

> **[Image]** AWS CodeBuild Test Reports console screenshot showing a donut chart with 75% pass rate, 3 passed and 1 failed/error, report duration 0.012 seconds, created 1 hour ago. Below shows a Test cases table with 4 test cases - one Failed and three Succeeded with millisecond durations.

### CodeBuild – Test Reports

- Contains details about tests that are run during builds
- **Unit tests, configuration tests, functional tests**
- Create your test cases with any test framework that can create report files in the following format:
  - JUnit XML, NUnit XML, NUnit3 XML
  - Cucumber JSON, TestNG XML, Visual Studio TRX
- Create a test report and add a **Report Group** name in **buildspec.yml** file with information about your tests

> **[Image]** buildspec.yml reports section showing php-reports with JUNITXML format and nunit-reports with NUNITXML format, with Report Group label highlighted.

---

## AWS CodeDeploy

- Deployment service that automates application deployment
- Deploy new applications versions to EC2 Instances, On-premises servers, Lambda functions, ECS Services
- Automated Rollback capability in case of failed deployments, or trigger CloudWatch Alarm
- Gradual deployment control
- A file named **appspec.yml** defines how the deployment happens

> **[Image]** Diagram showing four EC2 instances with v1 being replaced by v2 with arrows, illustrating rolling deployment.

### CodeDeploy – EC2/On-premises Platform

- Can deploy to EC2 Instances & on-premises servers
- Perform in-place deployments or blue/green deployments
- Must run the **CodeDeploy Agent** on the target instances
- Define deployment speed
  - **AllAtOnce:** most downtime
  - **HalfAtATime:** reduced capacity by 50%
  - **OneAtATime:** slowest, lowest availability impact
  - **Custom:** define your %

### CodeDeploy – In-Place Deployment

> **[Image]** Half At A Time deployment diagram showing 4 instances (v1). First batch of 2: v1 → gray (updating) → v2, while remaining 2 stay at v1. Then second batch: v1 → gray (updating) → v2. Result: all 4 instances at v2.

### CodeDeploy – Blue-Green Deployment

> **[Image]** Three-stage diagram:
> Stage 1: Application Load Balancer → Auto Scaling Group with 3 v1 instances
> Stage 2: ALB → original ASG (v1 × 3) + new Temp ASG (v2 × 3)
> Stage 3: Application Load Balancer → Auto Scaling Group with 3 v2 instances (v1 instances terminated)

### CodeDeploy Agent

- The CodeDeploy Agent must be running on the EC2 instances as a pre-requisites
- It can be installed and updated automatically if you're using Systems Manager
- The EC2 Instances must have sufficient permissions to access Amazon S3 to get deployment bundles

> **[Image]** EC2 Instance with CodeDeploy Agent downloading application from S3 Bucket. IAM Permissions JSON shown with s3:Get* and s3:List* actions allowed on Resource "*".

### CodeDeploy – Lambda Platform

- **CodeDeploy** can help you automate traffic shift for Lambda aliases
- Feature is integrated within the SAM framework
- **Linear:** grow traffic every N minutes until 100%
  - LambdaLinear10PercentEvery3Minutes
  - LambdaLinear10PercentEvery10Minutes
- **Canary:** try X percent then 100%
  - LambdaCanary10Percent5Minutes
  - LambdaCanary10Percent30Minutes
- **AllAtOnce:** immediate

> **[Image]** Diagram showing PROD Alias pointing to V1 (100-X%) and V2 (X%), with CodeDeploy managing the traffic shift. "Make X vary over time until X = 100%"

### CodeDepl