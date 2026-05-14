# ViciTarif 📞

Dashboard de tarificación de llamadas para contact centers con Vicidial.
Construido con **Next.js 15**, **PostgreSQL** y **JWT**.

---

## ¿Qué hace?

- Muestra KPIs del día: total de llamadas, costo, AHT y llamadas perdidas
- Registro de llamadas con tipo, duración, costo y estado
- Gráficas de llamadas por hora y costo acumulado
- Tarifas editables por tipo de llamada (admin)
- Calculadora de costo por llamada
- Login con JWT almacenado en cookie HttpOnly
- Mock data automático cuando no hay conexión a BD

---

## Stack

| Capa       | Tecnología                        |
|------------|-----------------------------------|
| Frontend   | React 18, Next.js 15 App Router   |
| Backend    | Next.js API Routes                |
| Base datos | PostgreSQL 16                     |
| Auth       | JWT con jose + bcryptjs           |
| Gráficas   | Recharts                          |

---

## Requisitos

- Node.js 18+
- PostgreSQL 16+
- npm 9+

---

## Instalación

**1. Clona el repositorio**

```bash
git clone https://github.com/tu-usuario/vicitarif-js.git
cd vicitarif-js
```

**2. Instala dependencias**

```bash
npm install
```

**3. Crea la base de datos**

```bash
createdb vicitarif
psql -d vicitarif -f schema.sql
```

**4. Configura variables de entorno**

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASS=
DB_NAME=vicitarif
JWT_SECRET=un_secreto_largo_y_aleatorio_minimo_32_chars
JWT_EXPIRES=8h
```

**5. (Opcional) Carga datos de prueba**

```bash
psql -d vicitarif -f seed.sql
```

**6. Arranca el servidor**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Usuarios por defecto

| Usuario    | Contraseña | Rol         |
|------------|------------|-------------|
| admin      | admin123   | admin       |
| supervisor | super456   | supervisor  |

> Cambia los passwords en producción editando `lib/auth.js`

---

## Estructura del proyecto

```
vicitarif-js/
├── app/
│   ├── page.jsx                    # Login (Server Component)
│   ├── layout.jsx                  # Root layout
│   ├── dashboard/
│   │   └── page.jsx                # Dashboard protegido
│   └── api/
│       ├── auth/
│       │   ├── login/route.js      # POST — genera JWT
│       │   └── logout/route.js     # POST — cierra sesión
│       ├── kpis/route.js           # GET  — métricas del día
│       ├── llamadas/route.js       # GET  — registro de llamadas
│       ├── por-hora/route.js       # GET  — llamadas por hora
│       ├── por-campana/route.js    # GET  — costo por campaña
│       └── tarifas/route.js        # GET/PUT/POST — tarifas
├── components/
│   ├── LoginForm.jsx
│   ├── DashboardClient.jsx         # Orquestador principal
│   ├── KpiCards.jsx
│   ├── CallTable.jsx
│   ├── TarifasPanel.jsx
│   ├── Calculadora.jsx
│   └── GraficasPanel.jsx
├── lib/
│   ├── auth.js                     # JWT helpers
│   ├── db.js                       # Pool PostgreSQL
│   └── mockData.js                 # Datos de prueba por fecha
├── middleware.js                   # Protección de rutas JWT
├── schema.sql                      # Esquema de BD
├── seed.sql                        # Datos de prueba
├── .env.example                    # Plantilla de variables
└── jsconfig.json                   # Alias @/ para imports
```

---

## Tablas de la BD

| Tabla          | Descripción                              |
|----------------|------------------------------------------|
| `llamadas`     | Registro central de llamadas             |
| `campanas`     | Catálogo de campañas                     |
| `agentes`      | Catálogo de agentes                      |
| `tarifas`      | Tarifas por tipo de llamada              |
| `kpis_diarios` | Resumen pre-calculado por día y campaña  |
| `usuarios`     | Usuarios del sistema (login)             |

---

## Scripts útiles

```bash
npm run dev      # Desarrollo con hot-reload
npm run build    # Compilar para producción
npm run start    # Servidor de producción
```

**Recalcular KPIs de un día:**
```sql
SELECT recalcular_kpis('2026-05-14');
```

**Limpiar datos de prueba:**
```sql
TRUNCATE llamadas, kpis_diarios RESTART IDENTITY;
```

---

## Seguridad

- JWT almacenado en cookie `HttpOnly` — no accesible desde JavaScript
- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- Middleware valida JWT en cada request a rutas protegidas
- `.env.local` excluido del repositorio vía `.gitignore`
- Solo el rol `admin` puede modificar tarifas

---

## Conectar a Vicidial real

Cuando tengas acceso a la BD depurada de Vicidial, actualiza `.env.local`:

```env
DB_HOST=IP_DEL_SERVIDOR
DB_PORT=5432
DB_USER=usuario_readonly
DB_PASS=password
DB_NAME=nombre_bd
```

Reinicia con `npm run dev` — el mock data deja de usarse automáticamente.

---

## Licencia

MIT
