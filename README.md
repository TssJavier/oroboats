## Oroboats

Proyecto basado en [Next.js](https://nextjs.org), desplegado en Vercel y con base de datos en Supabase.

### Configuración de entorno

Antes de iniciar, copia el archivo `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

Variables principales:

- `POSTGRES_URL_NON_POOLING` / `DATABASE_URL` / `POSTGRES_URL`: cadena de conexión a PostgreSQL.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: credenciales públicas de Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave de servicio de Supabase (solo servidor).
- `JWT_SECRET`: clave utilizada para firmar tokens JWT.
- `ADMIN_EMAIL` y `ADMIN_PASSWORD`: credenciales del administrador por defecto.

### Desarrollo

Instala las dependencias y ejecuta el servidor de desarrollo:

```bash
npm install
npm run dev
```

### Comandos útiles

- `npm run lint`: ejecuta ESLint.
- `npm run build`: genera la build de producción.
- `npm start`: inicia la aplicación en modo producción.

### Despliegue

El proyecto está preparado para desplegarse en Vercel. Asegúrate de configurar las variables de entorno en el panel de Vercel y en Supabase según corresponda.
