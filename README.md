# VirtFlow Frontend

A comprehensive React frontend for the VirtFlow virtualization resource management system. This application provides an enterprise-grade interface for managing physical infrastructure, virtual machines, Kubernetes clusters, and multi-tenant environments.

## Features

- **Dashboard**: Real-time overview of infrastructure resources with interactive charts
- **Infrastructure Management**: Data centers, racks, physical servers, and network configuration
- **Virtual Machine Management**: VM lifecycle management, specifications, and monitoring
- **Kubernetes Management**: Cluster management, plugins, and service mesh configuration
- **Multi-Tenant Support**: Resource allocation and quota management per tenant
- **Maintenance Management**: Scheduled maintenance windows and history tracking
- **User Management**: Role-based access control and permissions
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Technology Stack

- **React 18+** with TypeScript for type safety
- **Material-UI (MUI) v5** for modern UI components
- **React Router v6** for client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Yup validation for forms  
- **Recharts** for data visualization
- **Axios** for HTTP client with request/response interceptors
- **React Hot Toast** for notifications
- **Vite** for fast development and optimized builds

## Prerequisites

- Node.js 18+ and npm
- Access to VirtFlow Django backend API
- Modern web browser with ES2020+ support

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd virtflow/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8201/api/v1` |
| `VITE_APP_NAME` | Application name | `VirtFlow` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `VITE_DEV_MODE` | Enable development features | `true` |
| `VITE_SESSION_TIMEOUT` | Session timeout in milliseconds | `86400000` |

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production-ready application
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code analysis
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run test suite with Jest
- `npm run test:coverage` - Run tests with coverage report

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (buttons, forms, etc.)
│   └── feature/        # Feature-specific components
├── pages/              # Page components for routes
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard and overview
│   ├── infrastructure/# Infrastructure management
│   ├── virtualization/# VM and tenant management
│   ├── kubernetes/    # K8s cluster management
│   ├── maintenance/   # Maintenance scheduling
│   └── admin/         # User and system administration
├── services/           # API services and external integrations
│   ├── api/           # API client and endpoints
│   └── auth/          # Authentication service
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and helpers
├── constants/          # Application constants and configuration
└── layouts/            # Layout components
```

## Key Features

### Authentication & Authorization
- JWT token-based authentication with automatic refresh
- Role-based access control (RBAC)
- Permission-based UI rendering
- Session management with inactivity timeout

### Dashboard & Analytics
- Real-time resource utilization charts
- Infrastructure health monitoring
- Activity logs and audit trails
- Customizable dashboard widgets

### Infrastructure Management
- Hierarchical data center view (Fabrication → Phase → Data Center → Room → Rack)
- Physical server inventory with detailed specifications
- Network configuration (VLANs, VRFs, BGP)
- Power and cooling monitoring

### Virtualization
- VM lifecycle management (create, start, stop, delete)
- VM templates and specifications
- Resource allocation and monitoring  
- Multi-tenant resource isolation

### Kubernetes Integration
- Multi-cluster management dashboard
- Node scaling and plugin management
- Service mesh configuration (Istio, Linkerd)
- Bastion host access management

## API Integration

The frontend integrates with the VirtFlow Django REST API:

- **Base URL**: Configurable via `VITE_API_BASE_URL`
- **Authentication**: Bearer token in Authorization header
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Caching**: Intelligent caching with TanStack Query
- **Real-time Updates**: WebSocket support for live data

### Main API Endpoints

- `/auth/` - Authentication and user management
- `/fabrications/` - Data center fabrication management
- `/baremetals/` - Physical server management
- `/virtual-machines/` - VM lifecycle management
- `/k8s-clusters/` - Kubernetes cluster operations
- `/tenants/` - Multi-tenant resource management

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow React functional component patterns
- Implement proper error boundaries
- Use React hooks for state management
- Follow Material-UI design system

### State Management
- Use TanStack Query for server state
- Use React Context for global client state
- Prefer local state for component-specific data
- Implement optimistic updates where appropriate

### Testing
- Write unit tests for utility functions
- Test React components with React Testing Library
- Mock API calls in tests
- Maintain >80% code coverage

### Performance
- Implement code splitting for routes
- Use React.memo for expensive components
- Optimize bundle size with tree shaking
- Implement virtualization for large data sets

## Deployment

### Docker Deployment

1. **Build Docker image**
   ```bash
   docker build -t virtflow-frontend .
   ```

2. **Run container**
   ```bash
   docker run -p 80:80 -e VITE_API_BASE_URL=http://your-api-url virtflow-frontend
   ```

### Production Build

1. **Create production build**
   ```bash
   npm run build
   ```

2. **Serve static files**
   ```bash
   npm run preview
   # Or deploy dist/ folder to your web server
   ```

### Environment-specific Builds

- **Development**: `npm run dev`
- **Staging**: `VITE_API_BASE_URL=https://staging-api.example.com npm run build`
- **Production**: `VITE_API_BASE_URL=https://api.example.com npm run build`

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the established code style and patterns
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Use semantic commit messages
5. Create feature branches from main
6. Submit pull requests with detailed descriptions

## Security Considerations

- All API communications use HTTPS in production
- JWT tokens are stored securely and auto-refresh
- Input validation on all user forms
- XSS protection with Content Security Policy
- CSRF protection for API requests

## Performance Monitoring

The application includes built-in performance monitoring:

- Bundle size analysis with webpack-bundle-analyzer
- Core Web Vitals tracking
- Error tracking and reporting
- API response time monitoring

## Support

For technical support or questions:

1. Check the documentation and README
2. Review existing GitHub issues
3. Create a new issue with detailed reproduction steps
4. Contact the development team

## License

This project is proprietary software. All rights reserved.

---

**VirtFlow** - Enterprise Virtualization Resource Management System
