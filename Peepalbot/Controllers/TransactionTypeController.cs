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
    public class TransactionTypeController : Controller
    {
        private TransactionTypeService _service = new TransactionTypeService();

        // GET: TransactionType
        public ActionResult Index()
        {
            return View(_service.GetList());
        }

        // GET: TransactionType/Details/5
        public ActionResult Details(int id)
        {
            var transactionType = _service.GetDetails(id);

            if (Request.IsAjaxRequest())
            {

                //return PartialView("_details",model);
                ResponseMessage responseMessage = new ResponseMessage(MessageType.Info)
                {
                    Status = true,
                    Message = "",
                    Data = transactionType,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            return View(transactionType);
        }

        // GET: TransactionType/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: TransactionType/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create( TransactionType transactionType)
        {
            if (ModelState.IsValid)
            {
                _service.Create(transactionType);
                return RedirectToAction("Index");
            }

            return View(transactionType);
        }

        // GET: TransactionType/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var transactionType = _service.GetDetails((int)id);
            if (transactionType == null)
            {
                return HttpNotFound();
            }
            return View(transactionType);

        }

        // POST: TransactionType/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit( TransactionType transactionType)
        {
            if (ModelState.IsValid)
            {
                _service.Update(transactionType);
                return RedirectToAction("Index");
            }

            return View(transactionType);
        }

        // GET: TransactionType/Delete/5
        public ActionResult Delete(int? id)
        {

            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }

            var transactionType = _service.GetDetails((int)id);
            if (transactionType == null)
            {
                return HttpNotFound();
            }
            return View(transactionType);
        }

        // Post Delete
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



    }
}
