using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Web;
using System.Web.Mvc;
using System.Web.WebPages;

namespace PeopleBotTrust.Helpers
{
    public static partial class HtmlHelperExtensions
    {

        /// <summary>
        ///  @Html.LabelFor(m => m.modelproperty, @<span>&nbsp;&nbsp;&nbsp; LabelTitle</span>, new { @class = "control-label" })
        /// </summary>
        /// <typeparam name="TModel"></typeparam>
        /// <typeparam name="TValue"></typeparam>
        /// <param name="html"></param>
        /// <param name="expression"></param>
        /// <param name="labelText">@<span>&nbsp;&nbsp;&nbsp;start</span></param>
        /// <param name="htmlAttributes"></param>
        /// <returns></returns>
        public static MvcHtmlString LabelForBT<TModel, TValue>(this HtmlHelper<TModel> html, Expression<Func<TModel, TValue>> expression, Func<object, HelperResult> labelText, object htmlAttributes)
        {
            var attributes = HtmlHelper.AnonymousObjectToHtmlAttributes(htmlAttributes);
            var metadata = ModelMetadata.FromLambdaExpression(expression, html.ViewData);
            string htmlFieldName = ExpressionHelper.GetExpressionText(expression);
            //string labelText = metadata.DisplayName ?? metadata.PropertyName ?? htmlFieldName.Split('.').Last();
            if (String.IsNullOrEmpty(labelText.ToString()))
            {
                return MvcHtmlString.Empty;
            }

            TagBuilder tag = new TagBuilder("label");
            tag.MergeAttributes(attributes);
            tag.Attributes.Add("for", html.ViewContext.ViewData.TemplateInfo.GetFullHtmlFieldId(htmlFieldName));
            //tag.SetInnerText(labelText);
            tag.InnerHtml = labelText(null).ToHtmlString();
            return MvcHtmlString.Create(tag.ToString(TagRenderMode.Normal));
        }


    }
}