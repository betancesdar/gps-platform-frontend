# GPS Platform Frontend

Plataforma web completa de control GPS que envía rutas y coordenadas en tiempo real a múltiples dispositivos Android.

## 🚀 Stack Tecnológico

### Framework
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS**

### Mapa
- **Leaflet** + **react-leaflet**
- **OpenStreetMap** tiles

### Tiempo Real
- **Socket.IO Client**

### HTTP Client
- **Axios**

### Estado Global
- **Zustand**

### Utilidades
- **uuid**, **dayjs**, **clsx**

## 📦 Instalación

### 1. Instalar dependencias

```bash
npm install
```

Las dependencias incluyen:
```bash
npm install leaflet react-leaflet socket.io-client axios zustand uuid dayjs clsx @types/leaflet
```

### 2. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y configura las URLs del backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_MAP_CENTER_LAT=40.4168
NEXT_PUBLIC_MAP_CENTER_LNG=-3.7038
NEXT_PUBLIC_MAP_ZOOM=13
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:8547`

### 4. Compilar para producción

```bash
npm run build
npm start
```

## 🏗️ Arquitectura

### Estructura de Carpetas

```
/src
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard principal
│   ├── login/             # Página de login
│   └── routes/            # Gestión de rutas
├── components/
│   ├── map/               # Componentes del mapa
│   │   ├── MapContainer.tsx
│   │   ├── MapView.tsx
│   │   ├── DeviceMarker.tsx
│   │   └── RoutePolyline.tsx
│   ├── dashboard/         # Componentes del dashboard
│   │   ├── DeviceCard.tsx
│   │   ├── DeviceList.tsx
│   │   └── ControlPanel.tsx
│   ├── routes/            # Componentes de rutas
│   │   ├── RouteList.tsx
│   │   ├── RouteForm.tsx
│   │   └── RouteAssignment.tsx
│   └── ui/                # Componentes UI reutilizables
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       └── StatusBadge.tsx
├── hooks/                 # Custom hooks
│   ├── useSocket.ts
│   ├── useDeviceControl.ts
│   └── useRealTimePosition.ts
├── lib/                   # Configuración
│   ├── axios.ts
│   └── socket.ts
├── services/              # Servicios API
│   ├── auth.service.ts
│   ├── devices.service.ts
│   └── routes.service.ts
├── store/                 # Zustand stores
│   ├── useAuthStore.ts
│   ├── useDevicesStore.ts
│   ├── useRoutesStore.ts
│   └── useSocketStore.ts
└── types/                 # TypeScript types
    └── index.ts
```

## 🔌 Integración con Backend

### REST API Endpoints

#### Autenticación
- `POST /auth/login` - Login de usuario
- `POST /auth/logout` - Logout
- `GET /auth/me` - Obtener usuario actual

#### Dispositivos
- `GET /devices` - Listar dispositivos
- `GET /devices/:id` - Obtener dispositivo
- `POST /devices/:id/assign-route` - Asignar ruta
- `POST /devices/:id/start` - Iniciar ruta
- `POST /devices/:id/pause` - Pausar ruta
- `POST /devices/:id/stop` - Detener ruta
- `POST /devices/start-all` - Iniciar todos
- `POST /devices/stop-all` - Detener todos

#### Rutas
- `GET /routes` - Listar rutas
- `GET /routes/:id` - Obtener ruta
- `POST /routes` - Crear ruta
- `PUT /routes/:id` - Actualizar ruta
- `DELETE /routes/:id` - Eliminar ruta
- `POST /routes/upload-gpx` - Subir archivo GPX

### WebSocket Events

#### Eventos del Cliente → Servidor
El cliente se conecta automáticamente con autenticación JWT.

#### Eventos del Servidor → Cliente

**Conexión de dispositivos:**
```typescript
socket.on('device:connect', (data: DeviceConnectEvent) => {
  // { deviceId: string, timestamp: string }
});

socket.on('device:disconnect', (data: DeviceDisconnectEvent) => {
  // { deviceId: string, timestamp: string }
});
```

**Control de rutas:**
```typescript
socket.on('route:start', (data: RouteStartEvent) => {
  // { deviceId: string, routeId: string, timestamp: string }
});

socket.on('route:pause', (data: RoutePauseEvent) => {
  // { deviceId: string, timestamp: string }
});

socket.on('route:stop', (data: RouteStopEvent) => {
  // { deviceId: string, timestamp: string }
});
```

**Posiciones en tiempo real:**
```typescript
socket.on('device:position', (data: DevicePositionEvent) => {
  // {
  //   deviceId: string,
  //   position: {
  //     latitude: number,
  //     longitude: number,
  //     timestamp: string,
  //     speed?: number,
  //     bearing?: number
  //   },
  //   routeProgress?: number,
  //   currentPointIndex?: number
  // }
});
```

## 🗺️ Integración de Leaflet

### Configuración SSR-Safe

Los componentes del mapa usan importación dinámica para evitar problemas con SSR:

```typescript
const MapContainer = dynamic(
  () => import('./MapContainer').then((mod) => mod.MapContainer),
  { ssr: false }
);
```

### Ejemplo de Uso

```typescript
import { MapView } from '@/components/map/MapView';

function Dashboard() {
  return (
    <div className="h-[500px]">
      <MapView className="h-full w-full" />
    </div>
  );
}
```

### Marcadores Personalizados

Los dispositivos se muestran con marcadores personalizados que cambian de color según el estado:
- **Verde**: Online
- **Gris**: Offline
- **Animación pulsante**: Ruta en ejecución

## 📱 Funcionalidades Principales

### 1. Dashboard Principal
- Lista de dispositivos conectados
- Estado en tiempo real (online/offline)
- Ruta asignada a cada dispositivo
- Velocidad actual
- Controles individuales (start/pause/stop)
- Mapa con visualización de múltiples dispositivos

### 2. Mapa Interactivo
- Visualización de múltiples dispositivos simultáneamente
- Dibujo de rutas GPX
- Animación de movimiento en tiempo real
- Marcadores independientes por dispositivo
- Soporte para decenas o cientos de dispositivos

### 3. Gestión de Rutas
- Crear/listar/editar/eliminar rutas
- Subir archivos GPX
- Configurar velocidad
- Definir paradas con duración
- Opción de loop (repetición continua)
- Asignar rutas a dispositivos

### 4. Control en Tiempo Real
- Conexión WebSocket persistente
- Actualizaciones de posición en tiempo real
- Estado de conexión visible
- Controles globales (start all / stop all)

## 🎨 Componentes UI

### Button
```typescript
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
```

Variantes: `primary`, `secondary`, `danger`, `success`, `ghost`

### Card
```typescript
<Card padding="md" hover>
  <h3>Title</h3>
  <p>Content</p>
</Card>
```

### Modal
```typescript
<Modal isOpen={isOpen} onClose={handleClose} title="Modal Title" size="lg">
  <p>Modal content</p>
</Modal>
```

### StatusBadge
```typescript
<StatusBadge status="online" size="md" showDot />
```

Estados: `online`, `offline`, `running`, `paused`, `stopped`, `idle`

## 🔐 Autenticación

El sistema usa JWT tokens almacenados en localStorage:

```typescript
// Login
const { user, token } = await authService.login({ email, password });
login(user, token);

// Logout
logout();
router.push('/login');
```

Los tokens se inyectan automáticamente en todas las peticiones Axios y conexiones WebSocket.

## 🚦 Estado Global (Zustand)

### Auth Store
```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

### Devices Store
```typescript
const { devices, updateDevice, updateDevicePosition } = useDevicesStore();
```

### Routes Store
```typescript
const { routes, addRoute, removeRoute } = useRoutesStore();
```

### Socket Store
```typescript
const { isConnected, connectionError } = useSocketStore();
```

## 🎯 Hooks Personalizados

### useSocket
Maneja la conexión WebSocket y suscripciones a eventos:

```typescript
const { socket, isConnected, connectionError } = useSocket();
```

### useDeviceControl
Controla dispositivos con manejo de errores:

```typescript
const { startDevice, pauseDevice, stopDevice, isLoading, error } = useDeviceControl();

await startDevice(deviceId);
```

### useRealTimePosition
Suscripción a actualizaciones de posición:

```typescript
const { isConnected } = useRealTimePosition();
```

## 🔧 Configuración de Leaflet para Next.js

El proyecto está configurado para usar Leaflet con Next.js de forma segura:

1. **Importación dinámica** de componentes del mapa
2. **CSS de Leaflet** importado en `globals.css`
3. **Tipos TypeScript** incluidos con `@types/leaflet`

## 📊 Ejemplo de Datos

### Device
```typescript
{
  id: "device-1",
  name: "Device 001",
  androidId: "ABC123",
  status: "online",
  isActive: true,
  currentPosition: {
    latitude: 40.4168,
    longitude: -3.7038,
    timestamp: "2024-01-25T12:00:00Z",
    speed: 45.5
  },
  assignedRoute: { /* Route object */ },
  currentSpeed: 45.5,
  routeStatus: "running"
}
```

### Route
```typescript
{
  id: "route-1",
  name: "Ruta Centro",
  description: "Ruta por el centro de la ciudad",
  points: [
    { latitude: 40.4168, longitude: -3.7038, index: 0 },
    // ... más puntos
  ],
  stops: [
    {
      id: "stop-1",
      position: { latitude: 40.4168, longitude: -3.7038, timestamp: "..." },
      duration: 120,
      name: "Parada 1"
    }
  ],
  speed: 50,
  loop: true,
  distance: 5000,
  createdAt: "2024-01-25T12:00:00Z"
}
```

## 🐛 Debugging

### Ver logs de WebSocket
Los eventos de WebSocket se registran en la consola del navegador:
- ✅ Conexión exitosa
- ❌ Desconexión
- 🔄 Intentos de reconexión
- 📱 Eventos de dispositivos

### Verificar estado de Zustand
Usa React DevTools con la extensión de Zustand para inspeccionar el estado.

## 📝 Notas Importantes

- **NO ejecuta mock location** - El frontend solo visualiza y controla
- **NO usa Mapbox ni Google Maps** - Solo OpenStreetMap
- **NO usa Redux** - Estado manejado con Zustand
- **Preparado para escalar** - Soporta múltiples dispositivos simultáneos
- **TypeScript estricto** - Tipado completo en todo el proyecto

## 🤝 Integración con Backend NestJS

Este frontend está diseñado para trabajar con un backend NestJS que:
1. Gestiona dispositivos Android
2. Ejecuta mock location en los dispositivos
3. Envía actualizaciones en tiempo real vía WebSocket
4. Proporciona API REST para CRUD de rutas y dispositivos

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado siguiendo las especificaciones de una plataforma GPS profesional.
