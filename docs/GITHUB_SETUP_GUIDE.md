# Configuración de GitHub como Centro de Operaciones

¡Felicidades! Los archivos base (Plantillas de Issues, Pull Requests, Variables, y Arquitectura) ya están en tu repositorio. 
Ahora, para tener control **absoluto y profesional**, debes activar estas 3 funciones directamente en la interfaz de GitHub (Github.com). Solo el dueño o administrador del repositorio puede hacerlo.

---

## 🛡️ 1. Activar Protección de Ramas (Branch Protection)
El objetivo es prohibir subir código directamente a `main` y forzar el uso de Pull Requests. Así, cada línea de código quedará documentada y revisada.

1. Ve a tu repositorio en GitHub.com
2. Haz clic en **Settings** (Ajustes) en la barra superior.
3. En el menú lateral izquierdo, haz clic en **Rules** -> **Rulesets** y crea una nueva regla, o ve a **Branches** y haz clic en "Add branch protection rule".
4. En "Branch name pattern" escribe: `main`
5. Activa las siguientes opciones clave:
   - ✅ **Require a pull request before merging** (Forzar que nadie haga push directo, tienen que abrir PR).
   - ✅ **Require status checks to pass before merging** (Esto asegura que el Action de CI que acabamos de crear pase verde en `npm run build` antes de permitir juntar el código).
6. Haz clic en **Create** (Guardar).

---

## 🎯 2. Crear un Project Board (Kanban para Sprints/Roadmap)
Deja de usar bloc de notas, lleva todo el tracking en GitHub para que esté pegado a tu código.

1. Ve a tu repositorio en GitHub.com y haz clic en la pestaña **Projects** arriba.
2. Haz clic en **Link a project** -> **New project**.
3. Selecciona la plantilla **Board** (Se parece a Trello, con columnas TODO, In Progress, Done).
4. **Cómo usarlo**: A partir de ahora, si ves un bug o quieres la "Suscripción Premium", abres un Issue con las plantillas que configuramos, y lo arrastras a tu tablero. GitHub cerrará tus tareas automáticamente como "Done" cuando hagamos el Pull Request.

---

## 🏷️ 3. Adoptar Nomenclaturas Universales
A partir de ahora, nuestra manera de crear código cambiará a estándar de la industria. Nunca trabajaremos en `main`.

Abre la terminal en WSL y usa:
* `git checkout -b feature/añadir-metodo-pago` (Para características nuevas).
* `git checkout -b fix/error-pantalla-blanca` (Para solucionar bugs).
* `git checkout -b docs/mejorar-lectura` (Solo cambiar textos o guías).

Cuando el trabajo se acabe, publicas la rama, vas a GitHub y abres un Pull Request (saldrá la bonita plantilla pidiendo detalles). Cuando lo unas a `main` -> ¡Vercel lo sube a producción automáticamente y con seguridad!
