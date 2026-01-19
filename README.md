# FlowTo - Course Registration Management System

Система управления регистрациями на курсы с интеграцией Google Forms и Supabase.

## Возможности

- Синхронизация данных из Google Forms в Supabase
- Аутентификация через email/password и Google OAuth
- Управление пользователями (просмотр, редактирование)
- Просмотр регистраций по курсам
- Формирование списков участников
- Отправка email через почтовый клиент
- Отметка подтверждения участия

## Настройка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example` и заполните переменные:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Настройте Supabase:
   - Создайте проект в Supabase
   - Выполните SQL миграции из `supabase/migrations/001_initial_schema.sql`
   - Настройте Google OAuth в Authentication providers

4. Настройте Google Apps Script:
   - Откройте Google Forms
   - Нажмите на три точки (⋮) → Скрипты редактора
   - Скопируйте код из `google-apps-script/forms-sync.js`
   - Настройте переменные в начале файла:
     - `SUPABASE_URL` - URL вашего Supabase проекта
     - `SUPABASE_SERVICE_KEY` - Service Role Key (не anon key!)
   - Настройте `FIELD_MAPPING` под названия полей вашей формы
   - Создайте триггер: Ресурсы → Триггеры → Добавить триггер
     - Функция: `onFormSubmit`
     - Тип события: Отправка формы

5. Запустите проект:
```bash
npm run dev
```

## Деплой на GitHub Pages

Проект автоматически деплоится на GitHub Pages через GitHub Actions workflow.

### Настройка GitHub Secrets

В настройках репозитория (Settings → Secrets and variables → Actions) добавьте:
- `VITE_SUPABASE_URL` - URL вашего Supabase проекта
- `VITE_SUPABASE_ANON_KEY` - Anon (public) ключ Supabase

### Настройка base path

Если имя вашего репозитория отличается от `FlowTo`, обновите `base` в `vite.config.js`:
```js
base: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME/' : '/',
```

### Включение GitHub Pages

1. Перейдите в Settings → Pages
2. В разделе "Source" выберите "GitHub Actions"
3. После первого push в main ветку, workflow автоматически задеплоит приложение
