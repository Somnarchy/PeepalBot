using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using EFPeopleBotTrust;
using PeopleBotTrust.Helpers;
using PeopleBotTrust.Services;

namespace PeopleBotTrust.Controllers
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
        public ActionResult Edit(int id)
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
       
            return View(transactionType);
        }

        // GET: TransactionType/Delete/5
        public ActionResult Delete(int id)
        {

            return null;
        }

        //POST: TransactionType/Delete/5
        //[HttpPost, ActionName("Delete")]
        //[ValidateAntiForgeryToken]
        //public ActionResult DeleteConfirmed(short id)
        //{
        //    TransactionType transactionType = db.TransactionTypes.Find(id);
        //    db.TransactionTypes.Remove(transactionType);
        //    db.SaveChanges();
        //    return RedirectToAction("Index");
        //}


    }
}
