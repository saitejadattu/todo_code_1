const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')
const isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())
let db = null
const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializationDBAndServer()
const checkStatus = requestQuery => {
  return requestQuery.status !== undefined
}
const checkPriority = requestQuery => {
  return requestQuery.priority !== undefined
}
const checkPriorityAndStatus = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  )
}
const checksearch_q = requestQuery => {
  return requestQuery.search_q !== undefined
}
const checkstatusAndCategory = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const checkCategory = requestQuery => {
  return requestQuery.category !== undefined
}
const convertingToString = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

//get todo
app.get('/todo/', async (request, response) => {
  const tod = `
      SELECT * FROM todo;
  `
  const dbtod = await db.all(tod)
  response.send(dbtod)
})

//get
app.get('/todos/', async (request, response) => {
  const {status, priority, search_q, category} = request.query
  switch (true) {
    case checkStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        const statusQuery = `
          SELECT 
              *
          FROM
              todo
          WHERE
              status LIKE "%${status}%";
      `
        const dbStatus = await db.all(statusQuery)
        response.send(dbStatus.map(each => convertingToString(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case checkPriority(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        const priorityQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            priority LIKE "%${priority}%";
        `
        const dbPriority = await db.all(priorityQuery)
        response.send(dbPriority.map(each => convertingToString(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case checkPriorityAndStatus(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          const priorityAndStatusQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                priority LIKE "%${priority}%"
                  AND
                status LIKE "%${status}%";
        `
          const dbPriorityAndStatus = await db.all(priorityAndStatusQuery)
          response.send(
            dbPriorityAndStatus.map(each => convertingToString(each)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Ststus')
      }
      break
    case checksearch_q(request.query):
      const todoQuery = `
          SELECT 
              *
          FROM
              todo
          WHERE
              todo LIKE "%${search_q}%";
      `
      const dbtodo = await db.all(todoQuery)
      response.send(dbtodo.map(each => convertingToString(each)))
      break
    case checkCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        const categoryQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            category LIKE "%${category}%";
        `
        const dbCategory = await db.all(categoryQuery)
        response.send(dbCategory.map(each => convertingToString(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case checkstatusAndCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          const categoryAndStatusQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                category LIKE "%${category}%"
                  AND
                status LIKE "%${status}%";
        `
          const dbCategoryAndStatus = await db.all(categoryAndStatusQuery)
          response.send(
            dbCategoryAndStatus.map(each => convertingToString(each)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo category')
      }
      break
    case checkstatusAndCategory(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        const categoryQuery = `
          SELECT
            * 
          FROM
            todo
          WHERE
            category LIKE "%${category}%";
      `
        const dbCategory = await db.all(categoryQuery)
        response.send(dbCategory.map(each => convertingToString(each)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
  }
})

//get todo
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
    SELECT * FROM todo  WHERE id = ${todoId};
  `
  const dbTodo = await db.get(getTodoQuery)
  response.send(convertingToString(dbTodo))
})

//agenda convertingToString
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  console.log(isMatch(date, 'yyyy-MM-dd'))
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newdate = format(new Date(date), 'yyyy-MM-dd')
    console.log(newdate)
    const dateQuery = `
        SELECT * FROM todo WHERE due_date LIKE "%${newdate}%";
    `
    const dbDate = await db.all(dateQuery)
    response.send(dbDate.map(each => convertingToString(each)))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//post todo
app.post('/todos/', async (request, response) => {
  const {id, priority, status, todo, category, dueDate} = request.body
  if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
    if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postTodoQuery = `
            INSERT INTO todo (id, todo, status, priority, category, due_date)
            VALUES (
              ${id},"${todo}", "${priority}", "${status}", "${category}", "${dueDate}"
            );
        `
          const dbPost = await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Status')
  }
})

//put todos
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, category, priority, status, dueDate} = request.body
  console.log(request.body)
  switch (true) {
    case category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        const categoryQuery = `
          UPDATE todo
          SET 
            category = "${category}"
          WHERE 
            id = ${todoId};
        `
        await db.run(categoryQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case status !== undefined:
      console.log(status)
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        const statusQuery = `
            UPDATE todo
            SET 
              status = "${status}"
            WHERE 
              id = ${todoId};
          `
        const dbstatus = await db.run(statusQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        const priorityQuery = `
            UPDATE todo
            SET 
              priority = "${priority}"
            WHERE 
              id = ${todoId};
          `
        const dbPriority = await db.run(priorityQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const priorityQuery = `
            UPDATE todo
            SET 
              due_date = "${dueDate}"
            WHERE 
              id = ${todoId};
          `
        const dbPriority = await db.run(priorityQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
    case todo !== undefined:
      const todoQuery = `
          UPDATE todo
          SET 
            todo = "${todo}"
          WHERE 
            id = ${todoId};
      `
      await db.run(todoQuery)
      response.send('Todo Updated')
  }
})

//delete
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
      DELETE FROM todo WHERE id = ${todoId};
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
