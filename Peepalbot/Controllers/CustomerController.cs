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
using Peepalbot.Models;

namespace Peepalbot.Controllers
{
    public class CustomerController : Controller
    {
        private CustomerService _service = new CustomerService();

        // GET: Customer
        public ActionResult Index()
        {
            var model = new CustomerModel();
            model.CustomerList = _service.GetList();
            return View(model);
        }

        // GET: Customer/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            var customer = _service.GetDetails((int)id);
            if (customer == null)
            {
                return HttpNotFound();
            }

            if (Request.IsAjaxRequest())
            {
                //return PartialView("_details",model);
                ResponseMessage responseMessage = new ResponseMessage(MessageType.Info)
                {
                    Status = true,
                    Message = "",
                    Data = customer,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            return View(customer);
        }

        // GET: Customer/Create
        public ActionResult Create()
        {
            var model = new CustomerModel();
            var accountTypeService = new AccountTypeService();
            model.AccountTypeSelectList = accountTypeService.GetSelectList();
            model.AccountDetails = new Account();
            return View(model);
        }

        // POST: Customer/Create
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create(CustomerModel model, FormCollection collection)
        {
            //customer save
            var customerId = _service.Create(model.CustomerDetails);

            //account save
            // need custermId
            if (model.AccountDetails != null)
            {
                var accountService = new AccountService();
                model.AccountDetails.CustomerId = customerId;
                accountService.Create(model.AccountDetails);
            }
            return RedirectToAction("Index");

        }

        // GET: Customer/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }

            var model = new CustomerModel()
            {
                CustomerDetails = _service.GetDetails((int)id)
            };
            //var customer = _service.GetDetails((int)id);

            if (model.CustomerDetails == null)
            {
                return HttpNotFound();
            }
            return View(model);
        }

        // POST: Customer/Edit/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(CustomerModel model, FormCollection collection)
        {
            try
            {
                var oldAccount = _service.GetDetails(model.CustomerDetails.Id);

                //oldAccount.CustomerId = model.Account.CustomerId;
                oldAccount.FirstName = model.CustomerDetails.FirstName;
                oldAccount.Phone = model.CustomerDetails.Phone;
                //oldAccount.ModifiedBy = model.Account.ModifiedBy;

                _service.Update(oldAccount);
                return RedirectToAction("Index");
            }
            catch (Exception e)
            {
                return View(model);
            }
        }

        // GET: Customer/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Customer customer = _service.GetDetails((int)id);
            if (customer == null)
            {
                return HttpNotFound();
            }
            return View(customer);
        }

        // POST: Customer/Delete/5

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

        //// POST: Customer/Delete/5
        //[HttpPost, ActionName("Delete")]
        //[ValidateAntiForgeryToken]
        //public ActionResult DeleteConfirmed(int id)
        //{
        //    _service.Delete(id);

        //    return RedirectToAction("Index");
        //}

        //protected override void Dispose(bool disposing)
        //{
        //    if (disposing)
        //    {
        //        _service..Dispose();
        //    }
        //    base.Dispose(disposing);
        //}

    }

}