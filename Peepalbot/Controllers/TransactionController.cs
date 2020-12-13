using EFPeepalbot;
using Peepalbot.Helpers;
using Peepalbot.Models;
using Peepalbot.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;

namespace Peepalbot.Controllers
{
    public class TransactionController : Controller
    {
        private TransactionService _service = new TransactionService();

        // GET: transaction
        public ActionResult Index()
        {
            return View(_service.GetList());
        }

        // GET: transaction/Details/5
        public ActionResult Details(int id)

        {
            var transaction = _service.GetDetails(id);

            if (Request.IsAjaxRequest())
            {
                //return PartialView("_details",model);
                ResponseMessage responseMessage = new ResponseMessage(MessageType.Info)
                {
                    Status = true,
                    Message = "",
                    Data = transaction,
                    Title = "Fetch Detail",
                };
                return Json(responseMessage, JsonRequestBehavior.AllowGet);
            }
            return View(transaction);
        }

        // GET: transaction/Create
        public ActionResult Create()
        {
            #region Account list
            var accountService = new AccountService();
            #endregion

            #region Customer List
            var customerService = new CustomerService();
            #endregion

            #region TransactionType List
            var transactionTypeService = new TransactionTypeService();
            #endregion

            var model = new TransactionModel()
            {
                AccountList = accountService.GetSelectList(),
                CustomerList = customerService.GetSelectList(),
                TransactionTypeList = transactionTypeService.GetSelectList(),
            };
            return View(model);
        }

        // POST: transaction/Create
        [HttpPost]
        // public ActionResult Create(FormCollection collection)
        public ActionResult Create(TransactionModel model, FormCollection formCollection)
        {
            try
            {
                _service.Create(model.Transaction);

                return RedirectToAction("Index");
            }
            catch (Exception e)
            {
                return View();
            }
        }

        // GET: Account/Edit/5
        public ActionResult Edit(int id)
        {           
            #region Account list
            var accountService = new AccountService();
            #endregion

            #region Customer List
            var customerService = new CustomerService();
            #endregion

            #region TransactionType List
            var transactionTypeService = new TransactionTypeService();
            #endregion

            var model = new TransactionModel()
            {   Transaction = _service.GetDetails(id),
                AccountList = accountService.GetSelectList(),
                CustomerList = customerService.GetSelectList(),
                TransactionTypeList = transactionTypeService.GetSelectList(),
            };
            return View(model);
        }

        // POST: Account/Edit/5
        [HttpPost]
        public ActionResult Edit(TransactionModel model, FormCollection collection)
        {
            try
            {
                var oldTransaction = _service.GetDetails(model.Transaction.Id);
                //oldTransaction.Account.Name = model.Account.Name;
                oldTransaction.TransactionTypeId = model.Transaction.TransactionTypeId;
                //oldAccount.ModifiedBy = model.Account.ModifiedBy;
                oldTransaction.Amount = model.Transaction.Amount;
                oldTransaction.Description = model.Transaction.Description;
                oldTransaction.EntryType = model.Transaction.EntryType;

                _service.Update(oldTransaction);
                return RedirectToAction("Index");
            }
            catch (Exception e)
            {
                return View(model);
            }

        }

        // GET: Transaction/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }

            var transaction = _service.GetDetails((int)id);
            if (transaction == null)
            {
                return HttpNotFound();
            }
            return View(transaction);
        }

        // POST: Account/Delete/5

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

        //// Get MonthlyMeeting
        //public ActionResult MonthlyMeeting()
        //{
        //    var model = new MonthlyInstallmentModel();

        //    return View(model);
        //}

        // Post MonthlyMeeting

        //[HttpPost]
        //public ActionResult MonthlyMeeting(FormCollection collection)
        //{
        //    //    var model = new TransactionModel();
        //    //    model.Transaction.Amount = Convert.ToDecimal(collection["Amount"]);
        //    //    _service.Create(model.Transaction);


        //    return RedirectToAction("Index");
        //    //}

        //}

        //    public ActionResult Detail(int accountId)
        //    {
        //        return View();
        //    }

        //    /// <summary>
        //    /// accountId, amount...transaction table data
        //    /// </summary>
        //    /// <returns></returns>
        //    public ActionResult Deposit()
        //    {
        //        return View();
        //    }

        // Get MonthlyMeeting

    }
}
