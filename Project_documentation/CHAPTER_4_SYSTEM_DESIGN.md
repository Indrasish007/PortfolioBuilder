# Chapter 4: System Design

## 4.1 System Architecture

PortfolioBuilder uses a decoupled multi-tier architectural pattern. The front-end React 19 application acts as a Single Page Application (SPA), rendering views on the client side. The back-end Django 6 application acts as a RESTful API gateway, managing database records, static assets, and third-party AI connections.

```
+---------------------------------------------------------------------------------+
|                               SYSTEM TOPOOLOGY                                  |
+-------------------+                                       +---------------------+
|   React SPA       | <========= HTTP REST / JWT =========> |   Django Gateway    |
| (Vite 7 Bundle)   |                                       | (WSGI / Gunicorn)   |
+-------------------+                                       +---------------------+
                                                               |          |
                                                 PostgreSQL    |          | HTTPS
                                                 ORM Query     v          v
                                                            +----+     +----------+
                                                            | DB |     | AI APIs  |
                                                            +----+     +----------+
```

### Architectural Tiers:
1. **Client Tier**: A React application bundled via Vite 7. Client routing is managed by `react-router-dom`, while Zustand manages user authentication and portfolio builder states.
2. **API Gateway Tier**: Django REST Framework handles routing, simplejwt authentication, CORS origins, and upload security.
3. **Database Tier**: Relational storage (SQLite locally, PostgreSQL in production).
4. **Integration Tier**: Handles file text extraction (`pdfplumber` / `mammoth`), AI processing (Groq / Google GenAI), and asset management (Cloudinary).

---

## 4.2 Entity Relationship Diagram (ERD)

The database schema is organized around the `Portfolio` model, which acts as the core relational hub linking user profiles to their education, projects, experiences, and analytics records.

### Relational Schema Diagram:

```
                  +-------------------+
                  |    CustomUser     |
                  +-------------------+
                     | 1           | 1
                     |             |
                     | 1           | 1
                  +------+      +---------+
                  |Profile|      |Portfolio| <---------+
                  +------+      +---------+           |
                                   | 1                 | 1
                                   |                   |
                                   v 1..*              |
                              +----------+             | 1
                              | Skills   |             |
                              | Projects |             |
                              | Experience             |
                              | Education|             |
                              | Blogs    |             |
                              | FAQs     |             |
                              +----------+             |
                                                       |
                                                       v 1
                                                 +-----------+
                                                 | Analytics |
                                                 +-----------+
                                                    | 1
                                                    |
                                                    v 1..*
                                                 +-----------+
                                                 | ViewStats |
                                                 | DevStats  |
                                                 | Country   |
                                                 +-----------+
```

---

## 4.3 Database Schema Tables

### Table 4.1: CustomUser Table (`users_customuser`)
| Field Name | Data Type | Null/Blank | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | Primary Key, Auto-increment | Unique identifier |
| `email` | EmailField | No | Unique, Indexed | Username for authentication |
| `username` | CharField(150) | No | Unique | Fallback username |
| `password` | CharField(128) | No | - | Hashed password |

### Table 4.2: Profile Table (`users_profile`)
| Field Name | Data Type | Null/Blank | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | Primary Key | Unique identifier |
| `user` | OneToOneField | No | Foreign Key to CustomUser | Link to user credentials |
| `name` | CharField(150) | Yes / Yes | - | User's full name |
| `title` | CharField(150) | Yes / Yes | - | Professional headline |
| `location` | CharField(150) | Yes / Yes | - | Geographic location |
| `bio` | TextField | Yes / Yes | - | Professional bio |
| `email` | EmailField | Yes / Yes | - | Independent contact email |
| `phone` | CharField(30) | Yes / Yes | - | Contact phone number |
| `avatar` | TextField | Yes / Yes | - | Base64 string or Cloudinary URL |
| `github` | URLField | Yes / Yes | - | GitHub profile link |
| `linkedin` | URLField | Yes / Yes | - | LinkedIn profile link |
| `resume_link` | TextField | Yes / Yes | - | Base64 encoded resume file |
| `last_edited_portfolio_id` | Integer | Yes / Yes | - | Session continuity tracker |

### Table 4.3: Portfolio Table (`portfolios_portfolio`)
| Field Name | Data Type | Null/Blank | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | Primary Key | Unique identifier |
| `user` | ForeignKey | No | Foreign Key to CustomUser | Link to owner |
| `name` | CharField(255) | No | Default: "Personal Portfolio" | Portfolio name |
| `template` | CharField(100) | No | Default: "Developer" | Selected layout style |
| `theme` | CharField(100) | No | Default: "Midnight" | Selected theme style |
| `status` | CharField(50) | No | Choices: Draft, Published | Deployment status |
| `slug` | SlugField | Yes / Yes | Unique | SEO-friendly URL slug |
| `domain` | CharField(255) | Yes / Yes | Unique | Connected custom domain |
| `views` | Integer | No | Default: 0 | Total view count |
| `sections` | JSONField | Yes / Yes | Default: list | Custom layout sections |
| `gallery` | JSONField | Yes / Yes | Default: list | User portfolio images |
| `videos` | JSONField | Yes / Yes | Default: list | Linked video files |
| `music` | JSONField | Yes / Yes | Default: list | Embedded audio players |
| `avatar` | TextField | Yes / Yes | - | Per-portfolio avatar image |
| `custom_seo_title` | CharField(70) | Yes / Yes | - | SEO title tag override |
| `custom_seo_description` | CharField(160) | Yes / Yes | - | SEO description tag override |
| `custom_og_image`| URLField | Yes / Yes | - | Social share image override |

### Table 4.4: Project Table (`portfolios_project`)
| Field Name | Data Type | Null/Blank | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | Primary Key | Unique identifier |
| `portfolio` | ForeignKey | No | Foreign Key to Portfolio | Parent portfolio link |
| `title` | CharField(255) | No | - | Project name |
| `description` | TextField | Yes / Yes | - | Detailed project summary |
| `tech` | JSONField | Yes / Yes | Default: list | Technologies list |
| `github` | CharField(500) | Yes / Yes | - | GitHub repository URL |
| `live` | CharField(500) | Yes / Yes | - | Live application URL |
| `featured` | BooleanField | No | Default: False | Feature toggle status |
| `image` | TextField | Yes / Yes | - | Base64 or Cloudinary URL |

### Table 4.5: PortfolioEvent Table (`portfolios_portfolioevent`)
| Field Name | Data Type | Null/Blank | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | Integer | No | Primary Key | Unique identifier |
| `portfolio` | ForeignKey | No | Foreign Key to Portfolio | Parent portfolio link |
| `event_type` | CharField(50) | No | - | Event: view, download, session_time |
| `visitor_id` | CharField(255) | No | - | Visitor signature hash |
| `duration` | Integer | No | Default: 0 | Session duration in seconds |
| `device` | CharField(50) | No | Default: "Desktop" | Client device category |
| `country` | CharField(100) | No | Default: "United States" | Country resolved from IP |
| `created_at` | DateTimeField | No | Auto_now_add | Timestamp of event |

---

## 4.4 PlantUML Diagrams

### 4.4.1 Use Case Diagram

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Portfolio Owner" as User
actor "Visitor / Recruiter" as Visitor
actor "System Admin" as Admin

rectangle "PortfolioBuilder SaaS Platform" {
    usecase "Register & Login" as UC1
    usecase "Upload & AI Parse Resume" as UC2
    usecase "Edit Portfolio & Layout" as UC3
    usecase "Save Changes (Upload Assets)" as UC4
    usecase "View Portfolio Page" as UC5
    usecase "Download Resume (PDF)" as UC6
    usecase "Click Project Demo Link" as UC7
    usecase "View Analytics Dashboard" as UC8
    usecase "Submit Support Ticket" as UC9
    usecase "Reply to Tickets" as UC10
}

User --> UC1
User --> UC2
User --> UC3
User --> UC4
User --> UC8
User --> UC9

Visitor --> UC5
Visitor --> UC6
Visitor --> UC7

Admin --> UC10
Admin --> UC8
@enduml
```

### 4.4.2 Activity Diagram: Onboarding and Resume Parsing

```plantuml
@startuml
start
:User uploads Resume file (PDF or DOCX);
if (Is file size < 10MB AND format valid?) then (yes)
  :Extract text using pdfplumber/mammoth;
  if (Is text extracted successfully?) then (yes)
    :Attempt Groq Parsing (Llama-3.3-70b-versatile);
    if (Groq parsing succeeds?) then (yes)
      :Retrieve parsed JSON response;
    else (no)
      :Trigger Gemini cascade fallback chain;
      if (Does Gemini cascade succeed?) then (yes)
        :Retrieve parsed JSON response;
      else (no)
        :Run local heuristic parsing fallback;
        :Extract fields using regex and keywords;
      endstyle
      endif
    endif
    :Validate and sanitize parsed JSON payload;
    :Map parsed records to Profile structure;
    :Render structured data in Onboarding Wizard;
    :Save configurations to Database;
    stop
  else (no)
    :Return Extraction Error;
    stop
  endif
else (no)
  :Return File Validation Error;
  stop
endif
@enduml
```

### 4.4.3 Sequence Diagram: Authentication and Token Rotation

```plantuml
@startuml
autonumber
actor User
boundary "React Client" as Client
boundary "Axios Interceptor" as Interceptor
control "simplejwt Middleware" as Auth
database Database

User -> Client: Click Login (submit credentials)
Client -> Auth: POST /api/auth/login/ (JSON Email/Password)
Auth -> Database: Validate user credentials
Database --> Auth: Valid credentials match
Auth --> Client: HTTP 200 OK (access_token, refresh_token)
Client -> Client: Save tokens in localStorage

== Standard API Request Flow ==
Client -> Interceptor: Request Profile Data
Interceptor -> Interceptor: Append "Authorization: Bearer <access_token>"
Interceptor -> Auth: GET /api/users/me/
Auth --> Client: HTTP 200 OK (User JSON payload)

== Token Expiration and Rotation Flow ==
Client -> Interceptor: Request Portfolio Save
Interceptor -> Interceptor: Append "Authorization: Bearer <access_token>"
Interceptor -> Auth: PUT /api/portfolios/1/
Auth -> Auth: Validate token signature
note over Auth: Token has expired (24h limit)
Auth --> Interceptor: HTTP 401 Unauthorized

Interceptor -> Interceptor: Detect 401, Intercept and queue request
Interceptor -> Auth: POST /api/auth/refresh/ (JSON refresh_token)
Auth -> Auth: Verify refresh_token signature
Auth -> Database: Blacklist old refresh token
Auth -> Database: Issue new access & refresh tokens
Database --> Auth: Tokens generated
Auth --> Interceptor: HTTP 200 OK (new access_token)
Interceptor -> Interceptor: Update access_token in localStorage
Interceptor -> Auth: Retry queued Save Request (with new access_token)
Auth --> Client: HTTP 200 OK (Save succeeded)
@enduml
```

### 4.4.4 Sequence Diagram: Public Visitor Tracking

```plantuml
@startuml
autonumber
actor Visitor
boundary "Public View Page" as Public
boundary "Client Router" as Router
control "Analytics View" as Tracker
database Database

Visitor -> Public: Load URL /p/johndoe
Public -> Router: Resolve Route parameter
Router -> Tracker: POST /api/portfolios/track-visit/ (Referrer, IP)
Tracker -> Tracker: Geocode Country using Client IP
Tracker -> Database: Log new PortfolioEvent (event_type: 'view')
Tracker -> Database: Update TrafficSource (increment count)
Tracker -> Database: Update PortfolioVisit (increment count)
Tracker --> Public: Render Portfolio Style Layout

== Session Duration Track ==
Public -> Public: Monitor visitor scroll engagement
Visitor -> Public: Leave Page (Trigger beforeunload event)
Public -> Tracker: navigator.sendBeacon(/api/portfolios/track-visit/) (session_time duration)
Tracker -> Database: Log duration details in PortfolioEvent
@enduml
```

### 4.4.5 Database Class Diagram

```plantuml
@startuml
class CustomUser {
  +int id
  +string email
  +string username
  +string password
}

class Profile {
  +int id
  +string name
  +string title
  +string location
  +string bio
  +string email
  +string phone
  +string avatar
  +string github
  +string linkedin
  +string resume_link
  +int last_edited_portfolio_id
}

class Portfolio {
  +int id
  +string name
  +string template
  +string theme
  +string status
  +string slug
  +string domain
  +int views
  +JSON sections
  +JSON gallery
  +string avatar
  +string custom_seo_title
  +string custom_seo_description
}

class Skill {
  +int id
  +string name
}

class Experience {
  +int id
  +string role
  +string company
  +string period
  +string description
}

class Project {
  +int id
  +string title
  +string description
  +JSON tech
  +string github
  +string live
  +boolean featured
  +string image
}

class Analytics {
  +int id
  +int downloads
}

class ViewStat {
  +int id
  +string day
  +int count
}

CustomUser "1" -- "1" Profile : has
CustomUser "1" -- "0..*" Portfolio : owns
Portfolio "1" -- "0..*" Skill : lists
Portfolio "1" -- "0..*" Experience : includes
Portfolio "1" -- "0..*" Project : hosts
Portfolio "1" -- "1" Analytics : aggregates
Analytics "1" -- "0..*" ViewStat : records
@enduml
```
