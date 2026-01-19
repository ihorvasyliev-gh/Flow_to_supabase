/**
 * Google Apps Script для синхронизации данных из Google Forms в Supabase
 * 
 * Инструкция по настройке:
 * 1. Откройте Google Forms
 * 2. Нажмите на три точки (⋮) → Скрипты редактора
 * 3. Вставьте этот код
 * 4. Настройте переменные ниже (SUPABASE_URL, SUPABASE_SERVICE_KEY)
 * 5. Сохраните проект
 * 6. Создайте триггер: Ресурсы → Триггеры → Добавить триггер
 *    - Выберите функцию: onFormSubmit
 *    - Тип события: Отправка формы
 *    - Источник события: Из формы
 */

// ========== НАСТРОЙКИ ==========
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Замените на ваш Supabase URL
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY'; // Замените на ваш Service Role Key (не anon key!)

// Названия полей в Google Forms (измените под вашу форму)
const FIELD_MAPPING = {
  timestamp: 'Timestamp',
  firstName: 'First Name',
  lastName: 'Last Name',
  mobileNumber: 'Mobile number',
  email: 'E-mail',
  address: 'Address',
  eircode: 'Eircode',
  dateOfBirth: 'Date of Birth',
  // Курсы - это checkbox поля
  courses: ['Manual Handling', 'SafePass', 'Customer Service', 'Security', 'HACCP', 'Barista', 'HCA', 'SNA', 'FAR', 'Clean Pass']
};

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========

/**
 * Триггер при отправке формы
 */
function onFormSubmit(e) {
  try {
    // Проверяем наличие объекта события (при ручном запуске его может не быть)
    if (!e || !e.response) {
      Logger.log('Ошибка: функция должна быть вызвана через триггер формы, а не вручную');
      Logger.log('Для тестирования используйте функцию testFormSubmit()');
      return;
    }
    
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Парсим ответы формы
    const formData = parseFormResponses(itemResponses);
    
    // Добавляем timestamp из формы
    formData.timestamp = formResponse.getTimestamp().toISOString();
    
    // Синхронизируем с Supabase
    syncToSupabase(formData);
    
    Logger.log('Форма успешно синхронизирована: ' + formData.email);
  } catch (error) {
    Logger.log('Ошибка при синхронизации: ' + error.toString());
    // Можно добавить отправку уведомления об ошибке
  }
}

/**
 * Тестовая функция для ручного запуска (синхронизирует последний ответ формы)
 */
function testFormSubmit() {
  try {
    const form = FormApp.getActiveForm();
    const formResponses = form.getResponses();
    
    if (formResponses.length === 0) {
      Logger.log('Нет ответов в форме для тестирования');
      return;
    }
    
    // Берем последний ответ
    const lastResponse = formResponses[formResponses.length - 1];
    const itemResponses = lastResponse.getItemResponses();
    
    // Парсим ответы формы
    const formData = parseFormResponses(itemResponses);
    
    // Добавляем timestamp из формы
    formData.timestamp = lastResponse.getTimestamp().toISOString();
    
    // Синхронизируем с Supabase
    syncToSupabase(formData);
    
    Logger.log('Тестовая синхронизация завершена: ' + formData.email);
  } catch (error) {
    Logger.log('Ошибка при тестовой синхронизации: ' + error.toString());
  }
}

/**
 * Ручной запуск синхронизации всех ответов
 */
function syncAllResponses() {
  try {
    const form = FormApp.getActiveForm();
    const formResponses = form.getResponses();
    
    Logger.log('Найдено ответов: ' + formResponses.length);
    
    for (let i = 0; i < formResponses.length; i++) {
      const formResponse = formResponses[i];
      const itemResponses = formResponse.getItemResponses();
      const formData = parseFormResponses(itemResponses);
      
      // Добавляем timestamp из формы
      formData.timestamp = formResponse.getTimestamp().toISOString();
      
      syncToSupabase(formData);
      
      // Небольшая задержка чтобы не превысить лимиты API
      Utilities.sleep(500);
    }
    
    Logger.log('Синхронизация завершена');
  } catch (error) {
    Logger.log('Ошибка при синхронизации всех ответов: ' + error.toString());
  }
}

/**
 * Парсинг ответов формы в структурированные данные
 */
function parseFormResponses(itemResponses) {
  const data = {
    timestamp: new Date().toISOString(),
    first_name: '',
    last_name: '',
    mobile_number: '',
    email: '',
    address: '',
    eircode: '',
    date_of_birth: null,
    courses: []
  };
  
  // Парсим каждый ответ
  itemResponses.forEach(function(itemResponse) {
    const item = itemResponse.getItem();
    const title = item.getTitle();
    const response = itemResponse.getResponse();
    
    // Сопоставляем поля
    if (title === FIELD_MAPPING.timestamp) {
      data.timestamp = new Date(response).toISOString();
    } else if (title === FIELD_MAPPING.firstName) {
      data.first_name = response;
    } else if (title === FIELD_MAPPING.lastName) {
      data.last_name = response;
    } else if (title === FIELD_MAPPING.mobileNumber) {
      data.mobile_number = response;
    } else if (title === FIELD_MAPPING.email) {
      data.email = response;
    } else if (title === FIELD_MAPPING.address) {
      data.address = response;
    } else if (title === FIELD_MAPPING.eircode) {
      data.eircode = response;
    } else if (title === FIELD_MAPPING.dateOfBirth) {
      if (response) {
        data.date_of_birth = new Date(response).toISOString().split('T')[0];
      }
    } else {
      // Проверяем, является ли это курсом (checkbox)
      const courseName = findCourseName(title, response);
      if (courseName) {
        if (Array.isArray(response)) {
          // Множественный выбор
          response.forEach(function(course) {
            const fullCourseName = courseName + (course !== courseName ? ' (' + course + ')' : '');
            if (data.courses.indexOf(fullCourseName) === -1) {
              data.courses.push(fullCourseName);
            }
          });
        } else if (response) {
          // Одиночный выбор
          const fullCourseName = courseName + (response !== courseName ? ' (' + response + ')' : '');
          if (data.courses.indexOf(fullCourseName) === -1) {
            data.courses.push(fullCourseName);
          }
        }
      }
    }
  });
  
  return data;
}

/**
 * Поиск названия курса в ответе
 */
function findCourseName(title, response) {
  // Проверяем точное совпадение
  for (let i = 0; i < FIELD_MAPPING.courses.length; i++) {
    const course = FIELD_MAPPING.courses[i];
    if (title.indexOf(course) !== -1) {
      return course;
    }
  }
  
  // Проверяем в ответе (может быть вариант с языком)
  if (response) {
    const responseStr = Array.isArray(response) ? response.join(' ') : response;
    for (let i = 0; i < FIELD_MAPPING.courses.length; i++) {
      const course = FIELD_MAPPING.courses[i];
      if (responseStr.indexOf(course) !== -1) {
        return course;
      }
    }
  }
  
  return null;
}

/**
 * Синхронизация данных с Supabase
 */
function syncToSupabase(formData) {
  try {
    // Проверяем, не был ли уже импортирован этот ответ
    const existingSubmission = checkExistingSubmission(formData.timestamp, formData.email);
    if (existingSubmission) {
      Logger.log('Ответ уже был импортирован: ' + formData.email);
      return;
    }
    
    // 1. Создаем или обновляем пользователя
    const userId = upsertUser(formData);
    
    // 2. Создаем курсы если их нет
    const courseIds = ensureCoursesExist(formData.courses);
    
    // 3. Связываем пользователя с курсами
    linkUserToCourses(userId, courseIds);
    
    // 4. Логируем импорт
    logFormSubmission(formData);
    
    Logger.log('Успешно синхронизировано: ' + formData.email);
  } catch (error) {
    Logger.log('Ошибка синхронизации с Supabase: ' + error.toString());
    throw error;
  }
}

/**
 * Проверка существующего импорта
 */
function checkExistingSubmission(timestamp, email) {
  try {
    // Проверяем только по timestamp, так как каждая отправка формы имеет уникальный timestamp
    // Это более надежно и не требует сложных запросов к JSON полям
    const url = SUPABASE_URL + '/rest/v1/form_submissions?select=id&google_form_timestamp=eq.' + encodeURIComponent(timestamp);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const data = JSON.parse(response.getContentText());
    return data && data.length > 0;
  } catch (error) {
    Logger.log('Ошибка при проверке существующего импорта: ' + error.toString());
    // В случае ошибки возвращаем false, чтобы не блокировать импорт
    return false;
  }
}

/**
 * Создание или обновление пользователя
 */
function upsertUser(formData) {
  const url = SUPABASE_URL + '/rest/v1/users';
  
  const userData = {
    first_name: formData.first_name,
    last_name: formData.last_name,
    mobile_number: formData.mobile_number || null,
    email: formData.email,
    address: formData.address || null,
    eircode: formData.eircode || null,
    date_of_birth: formData.date_of_birth || null
  };
  
  // Сначала пытаемся найти существующего пользователя
  const findUrl = url + '?email=eq.' + encodeURIComponent(formData.email) + '&select=id';
  const findResponse = UrlFetchApp.fetch(findUrl, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json'
    }
  });
  
  const existingUsers = JSON.parse(findResponse.getContentText());
  
  if (existingUsers && existingUsers.length > 0) {
    // Обновляем существующего пользователя
    const updateUrl = url + '?id=eq.' + existingUsers[0].id;
    const updateResponse = UrlFetchApp.fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify(userData)
    });
    
    const updated = JSON.parse(updateResponse.getContentText());
    return updated[0].id;
  } else {
    // Создаем нового пользователя
    const createResponse = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify(userData)
    });
    
    const created = JSON.parse(createResponse.getContentText());
    return created[0].id;
  }
}

/**
 * Создание курсов если их нет
 */
function ensureCoursesExist(courseNames) {
  const courseIds = [];
  
  for (let i = 0; i < courseNames.length; i++) {
    const courseName = courseNames[i];
    
    // Проверяем существование курса
    const findUrl = SUPABASE_URL + '/rest/v1/courses?name=eq.' + encodeURIComponent(courseName) + '&select=id';
    const findResponse = UrlFetchApp.fetch(findUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const existingCourses = JSON.parse(findResponse.getContentText());
    
    let courseId;
    if (existingCourses && existingCourses.length > 0) {
      courseId = existingCourses[0].id;
    } else {
      // Создаем новый курс
      const createUrl = SUPABASE_URL + '/rest/v1/courses';
      const createResponse = UrlFetchApp.fetch(createUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        payload: JSON.stringify({ name: courseName })
      });
      
      const created = JSON.parse(createResponse.getContentText());
      courseId = created[0].id;
    }
    
    courseIds.push(courseId);
  }
  
  return courseIds;
}

/**
 * Связывание пользователя с курсами
 */
function linkUserToCourses(userId, courseIds) {
  for (let i = 0; i < courseIds.length; i++) {
    const courseId = courseIds[i];
    
    // Проверяем существующую связь
    const findUrl = SUPABASE_URL + '/rest/v1/user_courses?user_id=eq.' + userId + '&course_id=eq.' + courseId + '&select=id';
    const findResponse = UrlFetchApp.fetch(findUrl, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const existingLinks = JSON.parse(findResponse.getContentText());
    
    if (!existingLinks || existingLinks.length === 0) {
      // Создаем новую связь
      const createUrl = SUPABASE_URL + '/rest/v1/user_courses';
      UrlFetchApp.fetch(createUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        payload: JSON.stringify({
          user_id: userId,
          course_id: courseId
        })
      });
    }
  }
}

/**
 * Логирование импорта формы
 */
function logFormSubmission(formData) {
  const url = SUPABASE_URL + '/rest/v1/form_submissions';
  
  const submissionData = {
    google_form_timestamp: formData.timestamp,
    raw_data: formData
  };
  
  UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    payload: JSON.stringify(submissionData)
  });
}

/**
 * Создание меню для ручного запуска
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Синхронизация с Supabase')
    .addItem('Синхронизировать все ответы', 'syncAllResponses')
    .addToUi();
}
