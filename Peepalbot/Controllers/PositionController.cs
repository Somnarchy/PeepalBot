using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using EFPeepalbot;
using Peepalbot.Helpers;
using Peepalbot.Services;

namespace Peepalbot.Controllers
{
    public class PositionController : Controller
    {
        private PositionService _service = new PositionService();

        // GET: Position
        public ActionResult Index()
        {
            return View(_service.GetList());
        }

        // GET: Position/Details/5
        public ActionResult Details(int id)
        {
            var position = _service.GetDetails(id);

            if (Request.IsAjaxRequest())
            {
                //return PartialView("_details",model);
                ResponseMessage responseMessage = new ResponseMessage(MessageType.Info)
                {
                    Status = true,
                    Message = "",
                    Data = position,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            return View(position);
        }

        // GET: Position/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: Position/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "Name,Description")] Position position)
        {
            if (ModelState.IsValid)
            {
                _service.Create(position);
                return RedirectToAction("Index");
            }

            return View(position);
        }

        // GET: Position/Edit/5
        public ActionResult Edit(short? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var position = _service.GetDetails((int)id);
            if (position == null)
            {
                return HttpNotFound();
            }
            return View(position);
        }

        // POST: Position/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(Position position)
        {
            if (ModelState.IsValid)
            {
                _service.Update(position);
                return RedirectToAction("Index");
            }
            return View(position);
        }

        // GET: Position/Delete/5
        public ActionResult Delete(short? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var position = _service.GetDetails((int)id);
            if (position == null)
            {
                return HttpNotFound();
            }
            return View(position);
        }


        // POST: Position/Delete/5
        [HttpPost]
        public JsonResult Delete(int id, FormCollection collection)
        {
            ResponseMessage responseMessage = null;
            try
            {
                _service.Delete(id);

                responseMessage = new ResponseMessage(MessageType.Success)
                {
                    Status = true,
                    Message = "Record successfully deleted.",
                    Title = "Delete record.",
                };
            }
            catch (Exception e)
            {
                responseMessage = new ResponseMessage(MessageType.Failure)
                {
                    Status = false,
                    Message = e.Message,
                    Title = "Error Deleting record."

                };
            }
            return Json(responseMessage);
        }

        // POST: Positions/Delete/5
        //[HttpPost, ActionName("Delete")]
        //[ValidateAntiForgeryToken]
        //public ActionResult DeleteConfirmed(short id)
        //{
        //    var  position = _service._Positions.Find(id);
        //    _service.Positions.Remove(position);
        //    _service.SaveChanges();
        //    return RedirectToAction("Index");
        //}

        //protected override void Dispose(bool disposing)
        //{
        //    if (disposing)
        //    {
        //        db.Dispose();
        //    }
        //    base.Dispose(disposing);
        //}

    }
    
}
