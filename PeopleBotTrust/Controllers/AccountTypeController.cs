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
    public class AccountTypeController : Controller
    {
        private AccountTypeService _service = new AccountTypeService();

        // GET: AccountType
        public ActionResult Index()
        {
            return View(_service.GetList());
        }

        // GET: AccountType/Details/5
        public ActionResult Details(int id)
        {
            var accountType = _service.GetDetails(id);
      
            if (Request.IsAjaxRequest())
            {
                //return PartialView("_details",model);
                ResponseMessage responseMessage = new ResponseMessage(MessageType.Info)
                {
                    Status = true,
                    Message = "",
                    Data = accountType,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            return View(accountType);
        }

        // GET: AccountType/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: AccountType/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "Name,Description")] AccountType accountType)
        {
            if (ModelState.IsValid)
            {
                _service.Create(accountType);
                return RedirectToAction("Index");
            }

            return View(accountType);
        }

        // GET: AccountType/Edit/5
        public ActionResult Edit(short? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            AccountType accountType = _service.GetDetails((int)id);
            if (accountType == null)
            {
                return HttpNotFound();
            }
            return View(accountType);
        }

        // POST: AccountType/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(AccountType accountType)
        {
            if (ModelState.IsValid)
            {
                _service.Update(accountType);
                return RedirectToAction("Index");
            }
            return View(accountType);
        }

        // GET: AccountType/Delete/5
        public ActionResult Delete(short? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }

            AccountType accountType = _service.GetDetails((int)id);
            if (accountType == null)
            {
                return HttpNotFound();
            }
            return View(accountType);
        }


        // POST: AccountType/Delete/5
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






        //POST: AccountType/Delete/5

        //[HttpPost, ActionName("Delete")]
        //[ValidateAntiForgeryToken]
        //public ActionResult DeleteConfirmed(int id)
        //{
        //    _service.Delete(id);
        //    return Json(true);

        //    return RedirectToAction("Index");
        //}        

    }
}
