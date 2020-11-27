$(document).ready(function () {

    $(document).on("click", ".delete-row", function () {
        let $this = $(this);

        bootbox.confirm({
            message: "Are you sure you want to delete the record?",
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
                if (result) {
                    AjaxDeleteRecord($this);
                }
            },


        });
    });
});


function AjaxDeleteRecord($this) {    
    let url = $this.attr("data-url");
    $.ajax({
        method: "Post",
        url: url,
        success: function (response) {
            if (response !== null && response.Status == true) {
                //console.log($this.closest("tr"))
                $this.closest("tr").css("background-color", "red").fadeOut(1500);
            } else if (response !== null && response.Status == false) {
                alert(response.Message);
            }
        },
        error: function (xhr, s) {
            console.log(xhr)
        }
    });
}

function AjaxDetailRecor() {

}