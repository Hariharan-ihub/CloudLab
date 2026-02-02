# CloudLab Services Analysis Report

This document provides a detailed analysis of the **fully completed** cloud services available in the CloudLab platform. Each service is verified against the codebase (Frontend Components and Backend Controllers).

## Overview of Completed Services

The following services are fully implemented with UI interaction, backend simulation logic, and API integration:

1.  **EC2 (Elastic Compute Cloud)**
2.  **S3 (Simple Storage Service)**
3.  **IAM (Identity and Access Management)**
4.  **VPC (Virtual Private Cloud)**
5.  **Security Groups (Firewall)**
6.  **EBS (Elastic Block Store)**
7.  **CloudWatch (Monitoring)**
8.  **Secrets Manager**

---

## 1. Amazon EC2 (Elastic Compute Cloud)

**User Story:**  
"As a user, I want to launch, manage, and connect to virtual servers so that I can host my applications in the cloud."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Launch Instance** | A multi-step wizard to configure and create a new virtual server. |
| **Connect** | Open a simulated "Smart Terminal" to interact with the instance via SSH. |
| **Stop Instance** | Temporarily shut down a running instance (keeps storage). |
| **Start Instance** | Power on a stopped instance. |
| **Reboot Instance** | Restart the OS of the instance. |
| **Terminate Instance** | Permanently delete the instance and release resources. |

### Important Fields (Launch Wizard)
*   **Name**: Tag for identifying the instance (e.g., "Web-Server").
*   **AMI (Image)**: Operating System selection.
    *   *Options*: Amazon Linux 2023, Ubuntu 22.04, macOS, Windows, Red Hat, Debian.
*   **Instance Type**: Hardware capacity configuration.
    *   *Options*: `t2.micro` (Free Tier), `t3.micro`.
*   **Key Pair**: Security credentials for login.
    *   *Options*: Select existing or **Create New Pair**.
*   **Network Settings**:
    *   **VPC**: Select virtual network.
    *   **Subnet**: Select specific availability zone/subnet.
    *   **Firewall**: Create new Security Group or select existing.
*   **Storage**: Root volume configuration.
    *   *Fields*: Size (GiB), Volume Type (gp2, gp3, io1, standard).
*   **User Data**: (Advanced) Bash scripts to run on startup.

---

## 2. Amazon S3 (Simple Storage Service)

**User Story:**  
"As a user, I want to store and retrieve data objects (files) in buckets so that I can host static assets or back up data."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Create Bucket** | Create a new global container for objects. |
| **Upload Object** | Upload files from the local machine to a bucket. |
| **View Object** | Preview the content and metadata of a stored object. |
| **Toggle Versioning** | Enable/Disable keeping multiple variants of an object in the bucket. |
| **Delete Object** | Remove a specific file from a bucket. |
| **Delete Bucket** | Permanently remove a bucket (must be empty usually, but simulation allows force). |

### Important Fields
*   **Bucket Name**: Global unique identifier (simulated unique check).
*   **Region**: Defaults to `us-east-1`.
*   **Object Upload**: File selection input.

---

## 3. IAM (Identity and Access Management)

**User Story:**  
"As a user, I want to manage access to my resources by creating users, groups, and roles with specific permissions."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Manage Users** | Create and delete IAM users. Assign them to groups. |
| **Manage Roles** | Create roles for services (like EC2) to access other resources. |
| **Manage Policies** | Define permissions documents (JSON) to control access. |
| **Manage Groups** | Create groups to organize users and manage permissions efficiently. |

### Important Fields
*   **Users**: 
    *   *User Name*: Logical identifier.
    *   *Group*: Assignment (e.g., Admins, Developers).
*   **Roles**:
    *   *Role Name*: Identifier.
    *   *Trusted Entity*: The service allowed to assume the role (e.g., `ec2.amazonaws.com`, `lambda.amazonaws.com`).
*   **Policies**:
    *   *Policy Name*: Identifier.
    *   *Policy Document*: JSON editor for defining Allow/Deny statements.
*   **Groups**:
    *   *Group Name*: Identifier.

---

## 4. Amazon VPC (Virtual Private Cloud) / Subnets

**User Story:**  
"As a user, I want to create a logically isolated network to launch my resources in a secure environment."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Create VPC** | Define a new virtual network. |
| **Create Subnet** | Partition the network into smaller segments (Availability Zones). |
| **Delete Resources** | Remove VPCs or Subnets. |

### Important Fields
*   **VPC**:
    *   *Name Tag*: Label.
    *   *IPv4 CIDR*: Network range (e.g., `10.0.0.0/16`).
*   **Subnet**:
    *   *VPC ID*: Parent network.
    *   *Availability Zone*: Physical location (e.g., `us-east-1a`).
    *   *IPv4 CIDR*: Sub-range (e.g., `10.0.1.0/24`).

---

## 5. Security Groups

**User Story:**  
"As a user, I want to act as a virtual firewall for my instances to control incoming and outgoing traffic."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Create Security Group** | Define a new firewall group within a VPC. |
| **Edit Inbound Rules** | Add/Remove specific traffic rules. |
| **Delete Security Group** | Remove the firewall group. |

### Important Fields
*   **Group Details**: Name, Description, VPC ID.
*   **Inbound Rules**:
    *   *Type*: SSH, HTTP, HTTPS, Custom TCP.
    *   *Protocol*: TCP/UDP.
    *   *Port Range*: e.g., 22, 80, 443, 8080.
    *   *Source*: IP range (e.g., `0.0.0.0/0` or My IP).

---

## 6. Amazon EBS (Elastic Block Store)

**User Story:**  
"As a user, I want to create persistent block storage volumes and attach them to my running EC2 instances."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Create Volume** | Provision a new hard drive volume. |
| **Attach Volume** | Connect an available volume to a running instance. |
| **Detach/Delete** | *Implicitly supported via simulation state reset or manual checks.* |

### Important Fields
*   **Create Volume**:
    *   *Size*: Capacity in GiB.
    *   *Availability Zone*: Must match the instance's zone.
*   **Attach Volume**:
    *   *Instance*: Selection of running instances.
    *   *Device Name*: Mount point (e.g., `/dev/sdf`).

---

## 7. Amazon CloudWatch

**User Story:**  
"As a user, I want to collect and monitor log data to understand my application's behavior."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Create Log Group** | Detailed containers for logs. |
| **View Streams** | Drill down into specific log streams. |
| **View Log Events** | Read simulated log entries (INFO/WARN/ERROR) with timestamps. |

### Important Fields
*   **Log Group Name**: Path-style name (e.g., `/aws/ec2/my-app`).
*   **Retention**: (Display only in simulation) How long logs are kept.

---

## 8. AWS Secrets Manager

**User Story:**  
"As a user, I want to securely store and retrieve confidential information like database credentials and API keys."

### User Options & Activities
| Action | Description |
| :--- | :--- |
| **Store Secret** | Save a new key/value pair securely. |
| **Retrieve Value** | Reveal the hidden secret value for use. |
| **Delete Secret** | Remove the secret. |

### Important Fields
*   **Secret Type**: (Simulated generic).
*   **Key/Value Pairs**: The actual data to hide.
*   **Secret Name**: Identifier path (e.g., `prod/myapp/db-password`).
