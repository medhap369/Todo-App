package controllers

import com.google.inject.Inject
import play.api.i18n.{MessagesApi, I18nSupport}
import play.api.mvc._

import play.api.data._
import play.api.data.Forms._
import play.api.libs.json._
import play.api.libs.functional.syntax._

import anorm._
import play.api.db._
import play.api.Play.current


case class Task(id: Int, name: String, var status: Int = 0)

object MyList {
  var l = List[Task]()

  def add(t: Task) = {
    l = l ::: List(t)
  }

  def remove(t: Task) = {
    l = l.filter(_.id != t.id)
  }

  def changeStatus(t: Task) = {
    l.filter(_.id == t.id).map(_.status = t.status)
  }

  def apply(l1: List[Task]) = {
    l = l1
  }
}



class Application @Inject()(val messagesApi: MessagesApi) extends Controller with I18nSupport {

  implicit val taskWrite = (
    (JsPath \ "id").write[Int] and
      (JsPath \ "name").write[String] and
      (JsPath \ "status").write[Int]
    )(unlift(Task.unapply))

  implicit val taskRead = (
    (JsPath \ "data" \ "id").read[Int] and
      (JsPath \ "data" \ "name").read[String] and
      (JsPath \ "data" \ "status").read[Int]
    )(Task.apply _)

  def index = Action {
    Ok(views.html.index("Hello Play Scala")).as(HTML)
  }

  def todoApp = Action {
    Ok(views.html.todoApp(""))
  }

  def getTodo = Action {

    val parser: RowParser[Task] = SqlParser.int("id") ~ SqlParser.str("name") ~ SqlParser.int("status") map {
      case id ~ name ~ status => Task(id, name, status)
    }


    DB.withConnection { implicit conn =>
      val demo = SQL(
        """
        SELECT * FROM TASK
        """).as(parser *)
      MyList.l = demo
    }

    Ok(Json.toJson(MyList.l))
  }

  def todoChange = Action(parse.json) { request =>


    val type1 = (request.body \ "type").validate[String].get

    request.body.validate[Task].fold(
      error => {
        BadRequest
      },
      task => {
        if (type1 == "add") {
          MyList.add(task)

          DB.withConnection { implicit conn =>

            val id: Option[Long] = SQL(
            """
              insert into TASK values({id}, {name}, {status})
            """
            ).on('id -> task.id, 'name -> task.name, 'status -> task.status).executeInsert()

          }
        }
        else if (type1 == "update") {
          MyList.changeStatus(task)

          DB.withConnection { implicit conn =>
            val id: Int = SQL(
              """
              update TASK set status={status} where id={id}
              """
            ).on('id -> task.id, 'status -> task.status).executeUpdate()
          }
        }
        else if (type1 == "remove") {
          MyList.remove(task)

          DB.withConnection { implicit conn =>
            val id: Int = SQL(
              """
              delete from TASK where id={id}
              """
            ).on('id -> task.id).executeUpdate()
          }
        }
      })

    println(MyList.l)
    Ok
  }
}

