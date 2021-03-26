/**
 * ParamQuery Pro v6.0.0
 * 
 * Copyright (c) 2012-2019 Paramvir Dhindsa (http://paramquery.com)
 * Released under Commercial license
 * http://paramquery.com/pro/license
 * 
 */
(function($) {
    var pq = window.pq = window.pq || {},
        mixin = pq.mixin = {};
    mixin.render = {
        getRenderVal: function(objP, render, iGV) {
            var column = objP.column,
                cer = column.exportRender;
            if ((render && cer !== false || cer) && (column.render || column._render || column.format)) {
                return iGV.renderCell(objP)
            } else {
                return [objP.rowData[objP.dataIndx], ""]
            }
        }
    };
    mixin.GrpTree = {
        buildCache: function() {
            var self = this,
                o = self.that.options,
                isGroup = self.model === "groupModel",
                data = isGroup ? self.that.pdata : o.dataModel.data,
                cache = self.cache = {},
                id = self.id,
                rd, rId;
            for (var i = 0, len = data.length; i < len; i++) {
                rd = data[i];
                if (!isGroup || rd.pq_gtitle) {
                    rId = rd[id];
                    if (rId !== null) {
                        cache[rId] = rd
                    } else {
                        throw "unknown id of row"
                    }
                }
            }
        },
        cascadeInit: function() {
            if (this.getCascadeInit()) {
                var self = this,
                    arr = [],
                    cbId = self.cbId,
                    that = self.that,
                    select = that.options[self.model].select,
                    data = that.pdata,
                    rd, i = 0,
                    len = data.length;
                for (; i < len; i++) {
                    rd = data[i];
                    if (rd[cbId]) {
                        if (self.isEditable(rd)) {
                            arr.push(rd);
                            delete rd[cbId]
                        } else if (select) {
                            rd.pq_rowselect = true
                        }
                    } else if (rd[cbId] === null) {
                        delete rd[cbId]
                    }
                }
                if (arr.length) {
                    self.checkNodes(arr, null, null, true)
                }
            }
        },
        cascadeNest: function(data) {
            var self = this,
                cbId = self.cbId,
                prop = self.prop,
                childstr = self.childstr,
                len = data.length,
                parentAffected, i = 0,
                rd, child;
            for (; i < len; i++) {
                rd = data[i];
                if (rd[prop]) {
                    parentAffected = true;
                    self.eachChild(rd, self.chkEachChild(cbId, rd[cbId], prop));
                    delete rd[prop]
                }
                if ((child = rd[childstr]) && child.length) self.cascadeNest(child)
            }
            if (parentAffected && self.hasParent(rd)) {
                self.eachParent(rd, self.chkEachParent(cbId))
            }
        },
        checkAll: function(check, evt) {
            check = check === null ? true : check;
            var self = this,
                that = self.that;
            return self.checkNodes(that.pdata, check, evt, null, true)
        },
        checkNodes: function(arr, check, evt, init, all) {
            if (check === null) check = true;
            var rd, ri, i = 0,
                len = arr.length,
                rows = [],
                ui = {
                    check: check
                },
                self = this,
                that = self.that,
                offset = that.riOffset,
                cbId = self.cbId,
                prop = self.prop,
                TM = that.options[self.model],
                cascadeCheck = all ? false : self.isCascade(TM),
                fireEvent = init && TM.eventForInit || !init,
                ret, select = TM.select;
            for (; i < len; i++) {
                rd = arr[i];
                if (this.isEditable(rd)) {
                    ri = rd.pq_ri;
                    rows.push({
                        rowData: rd,
                        rowIndx: ri,
                        rowIndxPage: ri - offset
                    })
                }
            }
            ui.rows = rows;
            ui.dataIndx = self.colUI.dataIndx;
            if (init) ui.init = init;
            if (fireEvent) {
                ret = that._trigger("beforeCheck", evt, ui)
            }
            if (ret !== false) {
                rows = ui.rows;
                len = rows.length;
                if (len) {
                    var chkRows = this.chkRows = [];
                    for (i = 0; i < len; i++) {
                        rd = rows[i].rowData;
                        cascadeCheck && (rd[prop] = true);
                        chkRows.push({
                            rd: rd,
                            val: check,
                            oldVal: rd[cbId]
                        });
                        rd[cbId] = check
                    }
                    cascadeCheck && self.cascadeNest(self.getRoots());
                    if (select) this.selectRows();
                    if (cascadeCheck) {
                        ui.getCascadeList = self.getCascadeList(self)
                    }
                    fireEvent && that._trigger("check", evt, ui);
                    chkRows.length = 0
                }
            }
            self.setValCBox();
            if (!init) {
                that.refresh({
                    header: false
                })
            }
        },
        chkEachChild: function(cbId, inpChk, prop) {
            return function(rd) {
                if (this.isEditable(rd)) {
                    if (!prop || !rd[prop]) {
                        var oldVal = rd[cbId];
                        if (inpChk !== null && oldVal !== inpChk) {
                            this.chkRows.push({
                                rd: rd,
                                val: inpChk,
                                oldVal: oldVal
                            });
                            rd[cbId] = inpChk
                        }
                    }
                }
            }
        },
        chkEachParent: function(cbId) {
            var childstr = this.childstr;
            return function(rd) {
                if (this.isEditable(rd)) {
                    var child = rd[childstr],
                        countTrue = 0,
                        countFalse = 0,
                        oldVal = rd[cbId],
                        rd2, chk, chk2;
                    for (var i = 0, len = child.length; i < len; i++) {
                        rd2 = child[i];
                        if (this.isEditable(rd2)) {
                            chk2 = rd2[cbId];
                            if (chk2) {
                                countTrue++
                            } else if (chk2 === null) {
                                chk = null;
                                break
                            } else {
                                countFalse++
                            }
                            if (countTrue && countFalse) {
                                chk = null;
                                break
                            }
                        }
                    }
                    if (chk === undefined) {
                        chk = countTrue ? true : false
                    }
                    if (oldVal !== chk) {
                        this.chkRows.push({
                            rd: rd,
                            val: chk,
                            oldVal: oldVal
                        });
                        rd[cbId] = chk
                    }
                }
            }
        },
        eachChild: function(node, fn) {
            fn.call(this, node);
            var childstr = this.childstr,
                child = node[childstr] || [],
                rd, i = 0,
                len = child.length;
            for (; i < len; i++) {
                rd = child[i];
                if (rd[childstr]) {
                    this.eachChild(rd, fn)
                } else {
                    fn.call(this, rd)
                }
            }
        },
        eachParent: function(node, fn) {
            while (node = this.getParent(node)) {
                fn.call(this, node)
            }
        },
        _flatten: function(data, parentRD, level, data2) {
            var self = this,
                len = data.length,
                id = self.id,
                pId = self.parentId,
                i = 0,
                rd, child, childstr = self.childstr;
            for (; i < len; i++) {
                rd = data[i];
                rd.pq_level = level;
                data2.push(rd);
                if (parentRD) {
                    rd[pId] = id ? parentRD[id] : parentRD
                }
                child = rd[childstr];
                if (child) {
                    self._flatten(child, rd, level + 1, data2)
                }
            }
        },
        flatten: function(data) {
            var data2 = [];
            this._flatten(data, null, 0, data2);
            return data2
        },
        getCascadeInit: function() {
            var ci = this._cascadeInit;
            this._cascadeInit = true;
            return ci
        },
        getNode: function(id) {
            return this.cache[id]
        },
        getParent: function(rd) {
            var pId = rd[this.parentId];
            return this.cache[pId]
        },
        hasParent: function(rd) {
            return rd[this.parentId] !== null
        },
        getRoots: function(_data) {
            var that = this.that,
                data = _data || that.pdata || [],
                len = data.length,
                i = 0,
                rd, data2 = [];
            for (; i < len; i++) {
                rd = data[i];
                if (rd.pq_level === 0 && !rd.pq_gsummary) {
                    data2.push(rd)
                }
            }
            if (len && !data2.length) {
                data2 = data
            }
            return data2
        },
        setCascadeInit: function(val) {
            this._cascadeInit = val
        },
        getCascadeList: function(self) {
            var list = [];
            return function() {
                if (!list.length) {
                    var rows = self.chkRows,
                        i = 0,
                        cbId = self.cbId,
                        len = rows.length;
                    for (; i < len; i++) {
                        var row = rows[i],
                            rd = row.rd,
                            ri = rd.pq_ri,
                            newRow = {},
                            oldRow = {};
                        newRow[cbId] = row.val;
                        oldRow[cbId] = row.oldVal;
                        list.push({
                            rowIndx: ri,
                            rowData: rd,
                            newRow: newRow,
                            oldRow: oldRow
                        })
                    }
                }
                return list
            }
        },
        getChildren: function(node) {
            return node[this.childstr]
        },
        getSummary: function(node) {
            return node.pq_child_sum
        },
        isAncestor: function(rdChild, rdParent) {
            var rd = rdChild;
            while (rd = this.getParent(rd)) {
                if (rd === rdParent) {
                    return true
                }
            }
        },
        isCascade: function(model) {
            return model.cascade && model.checkbox && !model.maxCheck
        },
        isEditable: function(rd) {
            if (rd.pq_gsummary) {
                return false
            }
            var that = this.that,
                editable, col = this.colCB;
            if (col && (editable = col.editable)) {
                if (typeof editable === "function") {
                    return editable.call(that, {
                        rowData: rd
                    })
                } else {
                    return editable
                }
            } else {
                return true
            }
        },
        isFolder: function(rd) {
            return rd.pq_close !== null || !!rd[this.childstr]
        },
        onCheckbox: function(self, TM) {
            return function(evt, ui) {
                if (TM.checkbox && self.colUI === ui.column) {
                    self.checkNodes([ui.rowData], ui.input.checked, evt)
                }
            }
        },
        onCMInit: function() {
            var self = this,
                that = self.that,
                columns = that.columns,
                model = self.model,
                colUI, colCB, isTree = model === "treeModel",
                M = that.options[model];
            if (M.checkbox && columns) {
                colCB = columns[M.cbId] || {
                    dataIndx: M.cbId
                };
                colCB.cb = {
                    check: true,
                    uncheck: false,
                    select: M.select,
                    header: M.checkboxHead,
                    maxCheck: M.maxCheck
                };
                colUI = isTree ? columns[M.dataIndx] : that.colModel[0]
            }
            self.colCB = colCB;
            self.colUI = colUI;
            if (columns && isTree) self.setCellRender()
        },
        onCustomSortTree: function(evt, ui) {
            var self = this,
                data = self.getRoots(ui.data);
            self.sort(data, ui.sort_composite);
            ui.data = self.flatten(data);
            return false
        },
        onRefresh: function(self, TM) {
            return function() {
                if (TM.checkbox) {
                    var $inp = this.$cont.find(".pq_indeter"),
                        i = $inp.length;
                    while (i--) {
                        $inp[i].indeterminate = true
                    }
                }
            }
        },
        refreshView: function(source) {
            this.that.refreshView({
                header: false,
                source: source
            })
        },
        renderCB: function(checkbox, rd, cbId) {
            if (rd.pq_gsummary) {
                return ""
            }
            var that = this.that,
                checked = "",
                disabled = "",
                indeter = "",
                cls;
            if (typeof checkbox === "function") {
                checkbox = checkbox.call(that, rd)
            }
            if (checkbox) {
                rd[cbId] && (checked = "checked");
                if (!this.isEditable(rd)) {
                    disabled = "disabled";
                    cls = "pq_disable"
                }
                rd[cbId] === null && (indeter = "class='pq_indeter'");
                return ["<input type='checkbox' " + indeter + " " + checked + " " + disabled + "/>", cls]
            }
        },
        selectRows: function() {
            var i = 0,
                rows = this.chkRows,
                len = rows.length;
            for (; i < len; i++) {
                var row = rows[i],
                    rd = row.rd,
                    val = row.val;
                rd.pq_rowselect = val
            }
        },
        sort: function(_data, sort_composite) {
            var childstr = this.childstr,
                getSortComp = function(level) {
                    return typeof sort_composite === "function" ? sort_composite : sort_composite[level]
                };
            (function sort(data, sort_comp) {
                var len = data.length,
                    i = 0,
                    nodes;
                if (len) {
                    if (sort_comp) data.sort(sort_comp);
                    sort_comp = getSortComp(data[0].pq_level + 1);
                    for (; i < len; i++) {
                        if (nodes = data[i][childstr]) {
                            sort(nodes, sort_comp)
                        }
                    }
                }
            })(_data, getSortComp(0))
        },
        copyArray: function(arrD, arrS) {
            for (var i = 0, len = arrS.length; i < len; i++) {
                arrD.push(arrS[i])
            }
        },
        _summaryT: function(dataT, pdata, dxs, summaryTypes, columns, T, rdParent) {
            var self = this,
                childstr = self.childstr,
                isGroup = self.model === "groupModel",
                summaryInTitleRow = T.summaryInTitleRow,
                colIndxs = self.that.colIndxs,
                showSummary = T.showSummary,
                titleInFirstCol = T.titleInFirstCol,
                i = 0,
                len = dataT.length,
                f = 0,
                cells = {},
                sumRow = {},
                sumRow2, rd, nodes, summaryType, dataIndx, id = self.id,
                parentId = self.parentId,
                diLevel = isGroup && rdParent ? T.dataIndx[rdParent.pq_level] : "",
                rows = [],
                dxsLen = dxs.length,
                _aggr = pq.aggregate;
            for (; f < dxsLen; f++) {
                dataIndx = dxs[f];
                cells[dataIndx] = []
            }
            for (; i < len; i++) {
                rd = dataT[i];
                sumRow2 = null;
                pdata.push(rd);
                if (nodes = rd[childstr]) {
                    sumRow2 = self._summaryT(nodes, pdata, dxs, summaryTypes, columns, T, rd);
                    for (f = 0; f < dxsLen; f++) {
                        dataIndx = dxs[f];
                        self.copyArray(cells[dataIndx], sumRow2[1][dataIndx])
                    }
                    self.copyArray(rows, sumRow2[2])
                }
                if (!isGroup || !rd.pq_gtitle) {
                    for (f = 0; f < dxsLen; f++) {
                        dataIndx = dxs[f];
                        cells[dataIndx].push(rd[dataIndx])
                    }
                    rows.push(rd)
                }
            }
            for (f = 0; f < dxsLen; f++) {
                dataIndx = dxs[f];
                summaryType = summaryTypes[f];
                summaryType = summaryType[diLevel] || summaryType.type;
                sumRow[dataIndx] = _aggr[summaryType](cells[dataIndx], columns[f], rows);
                if (summaryInTitleRow && rdParent) {
                    if (colIndxs[dataIndx] === 0 && titleInFirstCol) {} else rdParent[dataIndx] = sumRow[dataIndx]
                }
            }
            if (rdParent && (!isGroup || showSummary[rdParent.pq_level])) {
                sumRow.pq_level = rdParent.pq_level;
                sumRow[parentId] = rdParent[id];
                pdata.push(sumRow);
                rdParent.pq_child_sum = sumRow;
                sumRow.pq_hidden = rdParent.pq_close
            }
            sumRow.pq_gsummary = true;
            return [sumRow, cells, rows]
        },
        summaryT: function() {
            var self = this,
                that = self.that,
                o = that.options,
                T = o[self.model],
                roots = self.getRoots(),
                pdata = [],
                summaryTypes = [],
                dxs = [],
                columns = [],
                v = 0,
                column, summary, grandSumRow, CM = that.colModel,
                CMLength = CM.length;
            for (; v < CMLength; v++) {
                column = CM[v];
                summary = column.summary;
                if (summary && !$.isEmptyObject(summary)) {
                    dxs.push(column.dataIndx);
                    columns.push(column);
                    summaryTypes.push(summary)
                }
            }
            grandSumRow = self._summaryT(roots, pdata, dxs, summaryTypes, columns, T)[0];
            if (T.grandSummary) {
                grandSumRow.pq_grandsummary = true;
                self.summaryData = o.summaryData = [grandSumRow]
            } else {
                (self.summaryData || []).length = 0
            }
            that.pdata = pdata
        }
    }
})(jQuery);
(function($) {
    var pq = window.pq = window.pq || {},
        mixin = pq.mixin,
        ISIE = true;
    $(function() {
        var $inp = $("<input type='checkbox' style='position:fixed;left:-50px;top:-50px;'/>").appendTo(document.body);
        $inp[0].indeterminate = true;
        $inp.on("change", function() {
            ISIE = false
        });
        $inp.click();
        $inp.remove()
    });
    mixin.ChkGrpTree = {
        getCheckedNodes: function(all) {
            var that = this.that,
                data = all ? that.getData() : that.options.dataModel.data,
                len = data.length,
                i = 0,
                rd, arr = [],
                column = this.colCB || {},
                check = (column.cb || {}).check,
                cbId = column.dataIndx;
            if (cbId !== null) {
                for (; i < len; i++) {
                    rd = data[i];
                    if (rd[cbId] === check) {
                        arr.push(rd)
                    }
                }
            }
            return arr
        },
        hasCboxHead: function() {
            return ((this.colCB || {}).cb || {}).header
        },
        isHeadChecked: function() {
            return this.inpVal
        },
        onBeforeCheck: function(evt, ui) {
            if (ui.check && this.colCB) {
                var colCB = this.colCB,
                    cb = colCB.cb,
                    select = cb.select,
                    maxCheck = cb.maxCheck;
                if (maxCheck && this.colUI.dataIndx === ui.dataIndx) {
                    var ul = ui.rows.slice(0, maxCheck),
                        toCheck = ul.length,
                        di = colCB.dataIndx,
                        nodes = this.getCheckedNodes(true),
                        toUncheck = toCheck + nodes.length - maxCheck;
                    if (toUncheck > 0) {
                        nodes.slice(0, toUncheck).forEach(function(rd) {
                            rd[di] = cb.uncheck;
                            if (select) {
                                delete rd.pq_rowselect
                            }
                        })
                    }
                    ui.rows = ul
                }
            }
        },
        onHeaderChange: function(evt) {
            if (this.checkAll(evt.target.checked, evt) === false) {
                this.refreshHeadVal()
            }
        },
        onRefreshHeader: function() {
            var self = this,
                that = self.that;
            if (self.hasCboxHead()) {
                if (self.model === "groupModel" && !that.options[self.model].on) {
                    return
                }
                var $td = that.getCellHeader({
                        dataIndx: self.colUI.dataIndx
                    }),
                    $inp = $td.find("input");
                if (!$inp.length) {
                    $td.find(".pq-title-span").prepend('<input type="checkbox" />');
                    $inp = $td.find("input")
                }
                if (!self.$inp || $inp[0] !== self.$inp[0]) {
                    self.$inp = $inp;
                    self.refreshHeadVal();
                    if (ISIE) {
                        $inp.on("click", function(evt) {
                            if ($inp.data("pq_value") === null) {
                                $inp[0].checked = true;
                                $inp.data("pq_value", true);
                                self.onHeaderChange(evt)
                            }
                        })
                    }
                    $inp.on("change", function(evt) {
                        self.onHeaderChange(evt)
                    })
                }
            }
        },
        refreshHeadVal: function() {
            if (this.$inp) this.$inp.pqval({
                val: this.inpVal
            })
        },
        setValCBox: function() {
            if (!this.hasCboxHead()) {
                return
            }
            var that = this.that,
                options = that.options,
                col = this.colCB,
                di = col.dataIndx,
                ci = that.colIndxs[di],
                cb = col.cb,
                cbAll = cb.all,
                remotePage = options.pageModel.type === "remote",
                offset = remotePage || !cbAll ? that.riOffset : 0,
                data = cbAll ? options.dataModel.data : that.pdata,
                val = null,
                selFound = 0,
                rd, ri, rows = 0,
                unSelFound = 0;
            if (!data) {
                return
            }
            for (var i = 0, len = data.length; i < len; i++) {
                rd = data[i];
                ri = i + offset;
                if (!rd.pq_gsummary && !rd.pq_gtitle && this.isEditable(rd, col, ri, ci, di)) {
                    rows++;
                    if (rd[di] === cb.check) {
                        selFound++
                    } else {
                        unSelFound++
                    }
                }
            }
            if (selFound === rows && rows) {
                val = true
            } else if (unSelFound === rows) {
                val = false
            }
            this.inpVal = val;
            this.refreshHeadVal()
        },
        unCheckAll: function() {
            this.checkAll(false)
        },
        unCheckNodes: function(arr, evt) {
            this.checkNodes(arr, false, evt)
        }
    }
})(jQuery);
(function($) {
    var _p = $.ui.autocomplete.prototype;
    var _renderMenu = _p._renderMenu;
    var _renderItem = _p._renderItem;
    _p._renderMenu = function(ul, items) {
        _renderMenu.call(this, ul, items);
        var o = this.options,
            SI = o.selectItem;
        if (SI && SI.on) {
            var cls = SI.cls,
                cls = cls === undefined ? "ui-state-highlight" : cls;
            var val = this.element.val();
            if (val && cls) {
                $("a", ul).filter(function() {
                    return $(this).text() === val
                }).addClass(cls)
            }
        }
    };
    _p._renderItem = function(ul, item) {
        var li = _renderItem.call(this, ul, item);
        var o = this.options,
            HI = o.highlightText;
        if (HI && HI.on) {
            var val = this.element.val();
            if (val) {
                var re = new RegExp("(" + val + ")", "i"),
                    text = item.label;
                if (re.test(text)) {
                    var style = HI.style,
                        style = style === undefined ? "font-weight:bold;" : style,
                        cls = HI.cls,
                        cls = cls === undefined ? "" : cls;
                    text = text.replace(re, "<span style='" + style + "' class='" + cls + "'>$1</span>");
                    li.find("a").html(text)
                }
            }
        }
        return li
    };
    var _pq = $.paramquery = $.paramquery || {};
    var handleListeners = function(that, arg_listeners, evt, data) {
        var listeners = arg_listeners.slice(),
            i = 0,
            len = listeners.length,
            ret, removals = [];
        for (; i < len; i++) {
            var listener = listeners[i],
                cb = listener.cb,
                one = listener.one;
            if (one) {
                if (listener._oncerun) {
                    continue
                }
                listener._oncerun = true
            }
            ret = cb.call(that, evt, data);
            if (ret === false) {
                evt.preventDefault();
                evt.stopPropagation()
            }
            if (one) {
                removals.push(i)
            }
            if (evt.isImmediatePropagationStopped()) {
                break
            }
        }
        if (len = removals.length) {
            for (i = len - 1; i >= 0; i--) {
                listeners.splice(removals[i], 1)
            }
        }
    };
    _pq._trigger = function(type, evt, data) {
        var self = this,
            prop, orig, this_listeners = self.listeners,
            listeners = this_listeners[type],
            o = self.options,
            allEvents = o.allEvents,
            bubble = o.bubble,
            $ele = self.element,
            callback = o[type];
        data = data || {};
        evt = $.Event(evt);
        evt.type = self.widgetName + ":" + type;
        evt.target = $ele[0];
        orig = evt.originalEvent;
        if (orig) {
            for (prop in orig) {
                if (!(prop in evt)) {
                    evt[prop] = orig[prop]
                }
            }
        }
        if (allEvents) {
            if (typeof allEvents === "function") {
                allEvents.call(self, evt, data)
            }
        }
        if (listeners && listeners.length) {
            handleListeners(self, listeners, evt, data);
            if (evt.isImmediatePropagationStopped()) {
                return !evt.isDefaultPrevented()
            }
        }
        if (o.trigger) {
            $ele[bubble ? "trigger" : "triggerHandler"](evt, data);
            if (evt.isImmediatePropagationStopped()) {
                return !evt.isDefaultPrevented()
            }
        }
        if (callback) {
            var ret = callback.call(self, evt, data);
            if (ret === false) {
                evt.preventDefault();
                evt.stopPropagation()
            }
        }
        listeners = this_listeners[type + "Done"];
        if (listeners && listeners.length) {
            handleListeners(self, listeners, evt, data)
        }
        return !evt.isDefaultPrevented()
    };
    var event_on = function(that, type, cb, one, first) {
        var listeners = that.listeners[type];
        if (!listeners) {
            listeners = that.listeners[type] = []
        }
        listeners[first ? "unshift" : "push"]({
            cb: cb,
            one: one
        })
    };
    _pq.on = function() {
        var arg = arguments;
        if (typeof arg[0] === "boolean") {
            var first = arg[0],
                type = arg[1],
                cb = arg[2],
                one = arg[3]
        } else {
            var type = arg[0],
                cb = arg[1],
                one = arg[2]
        }
        var arr = type.split(" ");
        for (var i = 0; i < arr.length; i++) {
            var _type = arr[i];
            if (_type) {
                event_on(this, _type, cb, one, first)
            }
        }
        return this
    };
    _pq.one = function() {
        var len = arguments.length,
            arr = [];
        for (var i = 0; i < len; i++) {
            arr[i] = arguments[i]
        }
        arr[len] = true;
        return this.on.apply(this, arr)
    };
    var event_off = function(that, evtName, cb) {
        if (cb) {
            var listeners = that.listeners[evtName];
            if (listeners) {
                var removals = [];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    var listener = listeners[i],
                        cb2 = listener.cb;
                    if (cb === cb2) {
                        removals.push(i)
                    }
                }
                if (removals.length) {
                    for (var i = removals.length - 1; i >= 0; i--) {
                        listeners.splice(removals[i], 1)
                    }
                }
            }
        } else {
            delete that.listeners[evtName]
        }
    };
    _pq.off = function(type, cb) {
        var arr = type.split(" ");
        for (var i = 0; i < arr.length; i++) {
            var _type = arr[i];
            if (_type) {
                event_off(this, _type, cb)
            }
        }
        return this
    };
    var fn = {
        options: {
            items: ".pq-grid-cell.pq-has-tooltip,.pq-grid-cell[title]",
            position: {
                my: "center top",
                at: "center bottom"
            },
            content: function() {
                var $td = $(this),
                    $grid = $td.closest(".pq-grid"),
                    grid = $grid.pqGrid("instance"),
                    obj = grid.getCellIndices({
                        $td: $td
                    }),
                    rowIndx = obj.rowIndx,
                    dataIndx = obj.dataIndx,
                    pq_valid = grid.data({
                        rowIndx: rowIndx,
                        dataIndx: dataIndx,
                        data: "pq_valid"
                    }).data;
                if (pq_valid) {
                    var icon = pq_valid.icon,
                        title = pq_valid.msg;
                    title = title !== null ? title : "";
                    var strIcon = icon === "" ? "" : "<span class='ui-icon " + icon + " pq-tooltip-icon'></span>";
                    return strIcon + title
                } else {
                    return $td.attr("title")
                }
            }
        }
    };
    fn._create = function() {
        this._super();
        var $ele = this.element,
            eventNamespace = this.eventNamespace;
        $ele.on("pqtooltipopen" + eventNamespace, function(evt, ui) {
            var $grid = $(evt.target),
                $td = $(evt.originalEvent.target);
            $td.on("remove.pqtt", function(evt) {
                $grid.pqTooltip("close", evt, true)
            });
            if ($grid.is(".pq-grid")) {
                var grid = $grid.pqGrid("instance"),
                    obj = grid.getCellIndices({
                        $td: $td
                    }),
                    rowIndx = obj.rowIndx,
                    dataIndx = obj.dataIndx,
                    a, rowData = grid.getRowData({
                        rowIndx: rowIndx
                    });
                if ((a = rowData) && (a = a.pq_celldata) && (a = a[dataIndx]) && (a = a["pq_valid"])) {
                    var valid = a,
                        style = valid.style,
                        cls = valid.cls;
                    ui.tooltip.addClass(cls);
                    var olds = ui.tooltip.attr("style");
                    ui.tooltip.attr("style", olds + ";" + style)
                }
            }
        });
        $ele.on("pqtooltipclose" + eventNamespace, function(evt, ui) {
            var $grid = $(evt.target),
                $td = $(evt.originalEvent.target);
            $td.off(".pqtt")
        })
    };
    $.widget("paramquery.pqTooltip", $.ui.tooltip, fn)
})(jQuery);
(function($) {
    $.paramquery = $.paramquery || {};
    $.paramquery.onResize = function(ele, fn) {
        var attachEvent = false,
            $ele = $(ele);
        if ($ele.css("position") === "static") {
            $ele.css("position", "relative")
        }
        if (!attachEvent) {
            var $iframe = $('<iframe type="text/html" src="about:blank" class="pq-resize-iframe" ' + 'style="display:block;width:100%;height:100%;position:absolute;top:0;left:0;z-index:-1;overflow: hidden; pointer-events: none;" />').appendTo($ele);
            $iframe[0].data = "about:blank";
            $iframe.css("opacity", "0")
        }
        for (var i = 0; i < $ele.length; i++) {
            if (attachEvent) {
                $($ele[i]).on("resize", function(e) {
                    fn.call(ele, e)
                })
            } else {
                var ele2 = $iframe[i];
                var $win = $(ele2.contentWindow);
                $win.on("resize", function(evt) {
                    fn.call(ele, evt)
                })
            }
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        _proto_ = Array.prototype;
    !_proto_.find && (_proto_.find = function(fn, context) {
        for (var i = 0, len = this.length, item; i < len; i++) {
            item = this[i];
            if (fn.call(context, item, i, this)) {
                return item
            }
        }
    });
    !_proto_.findIndex && (_proto_.findIndex = function(fn, context) {
        for (var i = 0, len = this.length, item; i < len; i++) {
            item = this[i];
            if (fn.call(context, item, i, this)) {
                return i
            }
        }
        return -1
    });
    var pq = $.extend(window.pq, {
        arrayUnique: function(arr, key) {
            var newarr = [],
                i, len = arr.length,
                str, obj = {},
                key2;
            for (i = 0; i < len; i++) {
                str = arr[i];
                key2 = key ? str[key] : str;
                if (obj[key2] === 1) {
                    continue
                }
                obj[key2] = 1;
                newarr.push(str)
            }
            return newarr
        },
        cap1: function(str) {
            return str && str.length ? str[0].toUpperCase() + str.slice(1) : ""
        },
        elementFromXY: function(evt) {
            var x = evt.clientX,
                y = evt.clientY,
                $ele = $(document.elementFromPoint(x, y)),
                $e2;
            if ($ele.closest(".ui-draggable-dragging").length) {
                $e2 = $ele;
                $e2.hide();
                $ele = $(document.elementFromPoint(x, y));
                $e2.show()
            }
            return $ele
        },
        escapeHtml: function(val) {
            return val.replace(/&/g, "&amp;").replace(/<(\S)/g, "&lt;$1")
        },
        escapeXml: function(val) {
            return val.replace(/&/g, "&amp;").replace(/</g, "&lt;")
        },
        excelToJui: function() {
            var cache = {};
            return function(format) {
                var f = cache[format];
                if (!f) {
                    f = format.replace(/yy/g, "y").replace(/dddd/g, "DD").replace(/ddd/g, "D").replace(/mmmm/g, "MM").replace(/mmm/g, "M");
                    cache[format] = f
                }
                return f
            }
        }(),
        excelToNum: function() {
            var cache = {};
            return function(format) {
                var f = cache[format];
                if (!f) {
                    f = format.replace(/\\/g, "");
                    cache[format] = f
                }
                return f
            }
        }(),
        flatten: function(arr, arr2) {
            var i = 0,
                len = arr.length,
                val;
            arr2 = arr2 || [];
            for (; i < len; i++) {
                val = arr[i];
                if (val !== null) {
                    if (val.push) {
                        pq.flatten(val, arr2)
                    } else {
                        arr2.push(val)
                    }
                }
            }
            return arr2
        },
        toRC: function(part) {
            var arr = part.match(/([A-Z]+)(\d+)/),
                c = pq.toNumber(arr[1]),
                r = arr[2] - 1;
            return [r, c]
        },
        formatEx: function(column, val, condition, dt) {
            if (condition) {
                dt = dt || pq.getDataType(column);
                if (pq.filter.conditions[condition][dt]) return this.format(column, val, dt)
            }
            return val
        },
        format: function(column, val, dt) {
            var format = column.format;
            if (format && val !== null) {
                if (typeof format === "function") {
                    return format(val)
                }
                dt = dt || pq.getDataType(column);
                if (dt === "date") {
                    try {
                        var d = new Date(val);
                        if (d && !isNaN(d.getTime())) {
                            val = $.datepicker.formatDate(format, d)
                        }
                    } catch (ex) {}
                } else {
                    val = pq.formatNumber(val, format)
                }
            }
            return val
        },
        deFormat: function(column, val, condition) {
            if (val) {
                var format = column.format,
                    fr, found, dt;
                if (format) {
                    dt = pq.getDataType(column);
                    found = condition ? pq.filter.conditions[condition][dt] : true;
                    if (found) {
                        try {
                            if (typeof format === "function") {
                                val = column.deFormat(val)
                            } else if (dt === "date") {
                                fr = column.formatRaw || "mm/dd/yy";
                                if (fr !== format) {
                                    val = $.datepicker.parseDate(format, val);
                                    val = $.datepicker.formatDate(fr, val)
                                }
                            } else {
                                val = pq.deFormatNumber(val, format)
                            }
                        } catch (ex) {
                            val = null
                        }
                    }
                }
            }
            return val
        },
        fakeEvent: function($ele, event, timeout) {
            if (event === "timeout") {
                var to, evtName = "keyup change";
                $ele.off(evtName).on(evtName, function() {
                    clearTimeout(to);
                    to = setTimeout(function() {
                        $ele.triggerHandler("timeout")
                    }, timeout)
                })
            }
        },
        getAddress: function(addr) {
            var parts = addr.split(":"),
                part1 = this.toRC(parts[0]),
                r1 = part1[0],
                c1 = part1[1],
                part2 = this.toRC(parts[1] || parts[0]),
                r2 = part2[0],
                c2 = part2[1],
                rc = r2 - r1 + 1,
                cc = c2 - c1 + 1;
            return {
                r1: r1,
                c1: c1,
                rc: rc,
                cc: cc,
                r2: r2,
                c2: c2
            }
        },
        getDataType: function(column) {
            var dt = column.dataType,
                fdt;
            if (dt === "bool") fdt = "bool";
            else if (dt === "float" || dt === "integer") fdt = "number";
            else if (dt === "date") fdt = "date";
            return fdt || "string"
        },
        getFn: function() {
            var obj = {};
            return function(cb) {
                var fn = cb;
                if (typeof cb === "string") {
                    if (!(fn = obj[cb])) {
                        fn = window;
                        cb.split(".").forEach(function(part) {
                            fn = fn[part]
                        });
                        obj[cb] = fn
                    }
                }
                return fn
            }
        }(),
        isCtrl: function(evt) {
            return evt.ctrlKey || evt.metaKey
        },
        isDateFormat: function() {
            var cache = {};
            return function(format) {
                var f = cache[format];
                if (f === null) {
                    f = cache[format] = /^[mdy\s-\/,]*$/i.test(format)
                }
                return f
            }
        }(),
        isEmpty: function(cell) {
            for (var key in cell) {
                return false
            }
            return true
        },
        juiToExcel: function() {
            var cache = {};
            return function(format) {
                var f = cache[format];
                if (!f) {
                    f = format.replace(/y/g, "yy").replace(/DD/g, "dddd").replace(/D/g, "ddd").replace(/MM/g, "mmmm").replace(/M/g, "mmm");
                    cache[format] = f
                }
                return f
            }
        }(),
        makePopup: function(ele, forEle, onClose) {
            var rand = (Math.random() + "").replace(".", ""),
                evt = "mousedown.pq" + rand + " keydown.pq" + rand,
                close = function() {
                    $ele.remove();
                    $(document).off(evt);
                    if (onClose) onClose()
                },
                $ele = $(ele);
            $ele.addClass("pq-popup").on("keydown", function(evt) {
                if (evt.keyCode === $.ui.keyCode.ESCAPE) {
                    close()
                }
            });
            $(forEle).one("remove", function() {
                close()
            });
            $(document).on(evt, function(evt) {
                var $t = $(evt.target);
                if (!ele.contains($t[0]) && !pq.isCtrl(evt) && !$t.closest(".ui-datepicker").length && !$t.closest(forEle).length) {
                    close()
                }
            })
        },
        moveItem: function(node, data, indxOld, indx) {
            if (indxOld > indx) {
                data.splice(indxOld, 1);
                data.splice(indx++, 0, node)
            } else if (indxOld === indx) {
                indx++
            } else {
                data.splice(indx, 0, node);
                data.splice(indxOld, 1)
            }
            return indx
        },
        newLine: function(dataCell) {
            return isNaN(dataCell) && typeof dataCell === "string" ? dataCell.replace(/(\r\n|\r|\n)/g, "<br>") : dataCell
        },
        numToExcel: function() {
            var cache = {};
            return function(format) {
                var f = cache[format];
                if (!f) {
                    f = format.replace(/[^#0,.@]/g, function(a) {
                        return "\\" + a
                    });
                    cache[format] = f
                }
                return f
            }
        }(),
        objectify: function(arr) {
            var obj = {},
                len = arr.length;
            while (len--) {
                obj[arr[len]] = 1
            }
            return obj
        },
        unescapeXml: function() {
            var obj = {
                amp: "&",
                lt: "<",
                gt: ">",
                quot: '"',
                apos: "'"
            };
            return function(val) {
                return val.replace(/&(amp|lt|gt|quot|apos);/g, function(a, b) {
                    return obj[b]
                })
            }
        }()
    });
    _pq.select = function(objP) {
        var attr = objP.attr,
            opts = objP.options,
            groupIndx = objP.groupIndx,
            labelIndx = objP.labelIndx,
            valueIndx = objP.valueIndx,
            jsonFormat = labelIndx !== null && valueIndx !== null,
            grouping = groupIndx !== null,
            prepend = objP.prepend,
            dataMap = objP.dataMap,
            groupV, groupVLast, jsonF, dataMapFn = function() {
                var jsonObj = {};
                for (var k = 0; k < dataMap.length; k++) {
                    var key = dataMap[k];
                    jsonObj[key] = option[key]
                }
                return "data-map='" + JSON.stringify(jsonObj) + "'"
            },
            buffer = ["<select ", attr, " >"];
        if (prepend) {
            for (var key in prepend) {
                buffer.push('<option value="', key, '">', prepend[key], "</option>")
            }
        }
        if (opts && opts.length) {
            for (var i = 0, len = opts.length; i < len; i++) {
                var option = opts[i];
                if (jsonFormat) {
                    var value = option[valueIndx],
                        disabled = option.pq_disabled ? 'disabled="disabled" ' : "",
                        selected = option.pq_selected ? 'selected="selected" ' : "";
                    if (value === null) {
                        continue
                    }
                    jsonF = dataMap ? dataMapFn() : "";
                    if (grouping) {
                        var disabled_group = option.pq_disabled_group ? 'disabled="disabled" ' : "";
                        groupV = option[groupIndx];
                        if (groupVLast !== groupV) {
                            if (groupVLast !== null) {
                                buffer.push("</optgroup>")
                            }
                            buffer.push('<optgroup label="', groupV, '" ', disabled_group, " >");
                            groupVLast = groupV
                        }
                    }
                    if (labelIndx === valueIndx) {
                        buffer.push("<option ", selected, disabled, jsonF, ">", value, "</option>")
                    } else {
                        var label = option[labelIndx];
                        buffer.push("<option ", selected, disabled, jsonF, ' value="', value, '">', label, "</option>")
                    }
                } else if (typeof option === "object") {
                    for (var key in option) {
                        buffer.push('<option value="', key, '">', option[key], "</option>")
                    }
                } else {
                    buffer.push("<option>", option, "</option>")
                }
            }
            if (grouping) {
                buffer.push("</optgroup>")
            }
        }
        buffer.push("</select>");
        return buffer.join("")
    };
    $.fn.pqval = function(obj) {
        if (obj) {
            if (obj.incr) {
                var val = this.data("pq_value");
                this.prop("indeterminate", false);
                if (val) {
                    val = false;
                    this.prop("checked", false)
                } else if (val === false) {
                    val = null;
                    this.prop("indeterminate", true);
                    this.prop("checked", false)
                } else {
                    val = true;
                    this.prop("checked", true)
                }
                this.data("pq_value", val);
                return val
            } else {
                val = obj.val;
                this.data("pq_value", val);
                this.prop("indeterminate", false);
                if (val === null) {
                    this.prop("indeterminate", true);
                    this.prop("checked", false)
                } else if (val) {
                    this.prop("checked", true)
                } else {
                    this.prop("checked", false)
                }
                return this
            }
        } else {
            return this.data("pq_value")
        }
    };
    _pq.xmlToArray = function(data, obj) {
        var itemParent = obj.itemParent;
        var itemNames = obj.itemNames;
        var arr = [];
        var $items = $(data).find(itemParent);
        $items.each(function(i, item) {
            var $item = $(item);
            var arr2 = [];
            $(itemNames).each(function(j, itemName) {
                arr2.push($item.find(itemName).text().replace(/\r|\n|\t/g, ""))
            });
            arr.push(arr2)
        });
        return arr
    };
    _pq.xmlToJson = function(data, obj) {
        var itemParent = obj.itemParent;
        var itemNames = obj.itemNames;
        var arr = [];
        var $items = $(data).find(itemParent);
        $items.each(function(i, item) {
            var $item = $(item);
            var arr2 = {};
            for (var j = 0, len = itemNames.length; j < len; j++) {
                var itemName = itemNames[j];
                arr2[itemName] = $item.find(itemName).text().replace(/\r|\n|\t/g, "")
            }
            arr.push(arr2)
        });
        return arr
    };
    _pq.tableToArray = function(tbl) {
        var $tbl = $(tbl),
            colModel = [],
            data = [],
            $trs = $tbl.children("tbody").children("tr"),
            $trfirst = $trs.length ? $($trs[0]) : $(),
            $trsecond = $trs.length > 1 ? $($trs[1]) : $();
        $trfirst.children("th,td").each(function(i, td) {
            var $td = $(td),
                title = $td.html(),
                width = $td.width(),
                align = "left",
                dataType = "string";
            if ($trsecond.length) {
                var $tdsec = $trsecond.find("td:eq(" + i + ")"),
                    halign = $tdsec.attr("align"),
                    align = halign ? halign : align
            }
            var obj = {
                title: title,
                width: width,
                dataType: dataType,
                align: align,
                dataIndx: i
            };
            colModel.push(obj)
        });
        $trs.each(function(i, tr) {
            if (i === 0) {
                return
            }
            var $tr = $(tr);
            var arr2 = [];
            $tr.children("td").each(function(j, td) {
                arr2.push($.trim($(td).html()))
            });
            data.push(arr2)
        });
        return {
            data: data,
            colModel: colModel
        }
    };
    var _getNumFormat = function(_nformats) {
        return function(format, negative) {
            var obj, arr, re, m;
            if (format) {
                arr = format.split(":");
                format = negative && arr.length > 1 ? arr[1] : arr[0];
                if (obj = _nformats[format]) {
                    return obj
                }
                re = /^([^#]*|&#[^#]*)?[\,\.#0]*?([\,\s\.]?)([#0]*)([\,\s\.]?)([0]*?)(\s*[^#^0]*|&#[^#]*)?$/;
                m = format.match(re);
                if (m && m.length) {
                    obj = {
                        symbol: m[1] || "",
                        thouSep: m[2],
                        thousand: m[3].length,
                        decSep: m[4],
                        decimal: m[5].length,
                        symbolEnd: m[6] || ""
                    };
                    _nformats[format] = obj
                }
            }
            obj = obj || {
                symbol: "",
                symbolEnd: "",
                thouSep: ",",
                thousand: 3,
                decSep: ".",
                decimal: 2
            };
            return obj
        }
    }({});
    _pq.formatCurrency = function(o_val, format) {
        var val = parseFloat(o_val);
        if (isNaN(val)) {
            return
        }
        var negative = val < 0,
            obj = _getNumFormat(format, negative),
            symbol = obj.symbol,
            symbolEnd = obj.symbolEnd,
            thousand = obj.thousand,
            thouSep = obj.thouSep,
            decSep = obj.decSep,
            decimal = obj.decimal;
        val = val.toFixed(decimal);
        var len = val.length,
            sublen = decimal + decSep.length,
            fp = val.substring(0, len - sublen),
            lp = val.substring(len - sublen + decSep.length, len),
            arr = fp.match(/\d/g).reverse(),
            arr2 = [];
        for (var i = 0; i < arr.length; i++) {
            if (i > 0 && i % thousand === 0) {
                arr2.push(thouSep)
            }
            arr2.push(arr[i])
        }
        arr2 = arr2.reverse();
        fp = arr2.join("");
        return (negative ? "-" : "") + symbol + fp + decSep + lp + symbolEnd
    };
    pq.formatNumber = _pq.formatCurrency;
    pq.deFormatNumber = function(val, format) {
        var negative = val < 0,
            obj = _getNumFormat(format, negative),
            symbol = obj.symbol,
            symbolEnd = obj.symbolEnd,
            thouSep = obj.thouSep,
            decSep = obj.decSep;
        thouSep = thouSep === "." ? "\\." : thouSep;
        val = val.replace(symbol, "").replace(symbolEnd, "").replace(new RegExp(thouSep, "g"), "");
        if (decSep) val = val.replace(decSep, ".") * 1;
        return val
    };
    pq.validation = {
        is: function(type, val) {
            if (type === "string" || !type) {
                return true
            }
            type = type.substring(0, 1).toUpperCase() + type.substring(1, type.length);
            return this["is" + type](val)
        },
        isFloat: function(val) {
            var pf = parseFloat(val);
            if (!isNaN(pf) && pf === val) {
                return true
            } else {
                return false
            }
        },
        isInteger: function(val) {
            var pi = parseInt(val);
            if (!isNaN(pi) && pi === val) {
                return true
            } else {
                return false
            }
        },
        isDate: function(val) {
            var pd = Date.parse(val);
            if (!isNaN(pd)) {
                return true
            } else {
                return false
            }
        }
    };
    var NumToLetter = [],
        letterToNum = {};
    var toLetter = pq.toLetter = function(num) {
        var letter = NumToLetter[num];
        if (!letter) {
            num++;
            var mod = num % 26,
                pow = num / 26 | 0,
                out = mod ? String.fromCharCode(64 + mod) : (--pow, "Z");
            letter = pow ? toLetter(pow - 1) + out : out;
            num--;
            NumToLetter[num] = letter;
            letterToNum[letter] = num
        }
        return letter
    };

    function _toNum(letter) {
        return letter.charCodeAt(0) - 64
    }
    pq.toNumber = function(letter) {
        var num = letterToNum[letter],
            len, i, _let, _num, indx;
        if (num === null) {
            len = letter.length;
            num = -1;
            i = 0;
            for (; i < len; i++) {
                _let = letter[i];
                _num = _toNum(_let);
                indx = len - i - 1;
                num += _num * Math.pow(26, indx)
            }
            NumToLetter[num] = letter;
            letterToNum[letter] = num
        }
        return num
    };
    pq.generateData = function(rows, cols) {
        var alp = [];
        for (var i = 0; i < cols; i++) {
            alp[i] = toLetter(i)
        }
        var data = [];
        for (var i = 0; i < rows; i++) {
            var row = data[i] = [];
            for (var j = 0; j < cols; j++) {
                row[j] = alp[j] + (i + 1)
            }
        }
        return data
    }
})(jQuery);
(function($) {
    pq.validations = {
        minLen: function(value, reqVal, getValue) {
            value = getValue(value);
            reqVal = getValue(reqVal);
            if (value.length >= reqVal) {
                return true
            }
        },
        nonEmpty: function(value) {
            if (value !== null && value !== "") {
                return true
            }
        },
        maxLen: function(value, reqVal, getValue) {
            value = getValue(value);
            reqVal = getValue(reqVal);
            if (value.length <= reqVal) {
                return true
            }
        },
        gt: function(value, reqVal, getValue) {
            value = getValue(value);
            reqVal = getValue(reqVal);
            if (value > reqVal) {
                return true
            }
        },
        gte: function(value, reqVal, getValue) {
            value = getValue(value);
            reqVal = getValue(reqVal);
            if (value >= reqVal) {
                return true
            }
        },
        lt: function(value, reqVal, getValue) {
            value = getValue(value);
            reqVal = getValue(reqVal);
            if (value < reqVal) {
                return true
            }
        },
        lte: function(value, reqVal, getValue) {
            value = getValue(value);
            reqVal = getValue(reqVal);
            if (value <= reqVal) {
                return true
            }
        },
        neq: function(value, reqVal, getValue) {
            value = getValue(value);
            reqVal = getValue(reqVal);
            if (value !== reqVal) {
                return true
            }
        },
        regexp: function(value, reqVal) {
            if (new RegExp(reqVal).test(value)) {
                return true
            }
        }
    };
    var _pq = $.paramquery;
    _pq.cValid = function(that) {
        this.that = that
    };
    _pq.cValid.prototype = {
        _isValidCell: function(objP) {
            var that = this.that,
                column = objP.column,
                valids = column.validations;
            if (!valids || !valids.length) {
                return {
                    valid: true
                }
            }
            var value = objP.value,
                fn, dataType = column.dataType,
                getValue = function(val) {
                    return that.getValueFromDataType(val, dataType, true)
                },
                rowData = objP.rowData;
            if (!rowData) {
                throw "rowData required."
            }
            for (var j = 0; j < valids.length; j++) {
                var valid = valids[j],
                    on = valid.on,
                    type = valid.type,
                    _valid = false,
                    msg = valid.msg,
                    reqVal = valid.value;
                if (on === false) {
                    continue
                }
                if (fn = pq.validations[type]) {
                    _valid = value === null ? false : fn(value, reqVal, getValue)
                } else if (type) {
                    var obj2 = {
                        column: column,
                        value: value,
                        rowData: rowData,
                        msg: msg
                    };
                    if (that.callFn(type, obj2) === false) {
                        _valid = false;
                        msg = obj2.msg
                    } else {
                        _valid = true
                    }
                } else {
                    _valid = true
                }
                if (!_valid) {
                    return {
                        valid: false,
                        msg: msg,
                        column: column,
                        warn: valid.warn,
                        dataIndx: column.dataIndx,
                        validation: valid
                    }
                }
            }
            return {
                valid: true
            }
        },
        onScrollCell: function($td, msg, icon, cls, css, style) {
            var cell, that = this.that,
                o = that.options,
                bootstrap = o.bootstrap;
            if ($td || (cell = that.getEditCell()) && cell.$cell) {
                var $cell = $td || cell.$cell;
                $cell.attr("title", msg);
                var tooltipFn = "tooltip",
                    tooltipShowFn = "open";
                if (bootstrap.on && bootstrap.tooltip) {
                    tooltipFn = bootstrap.tooltip;
                    tooltipShowFn = "show"
                }
                try {
                    $cell[tooltipFn]("destroy")
                } catch (ex) {}
                $cell[tooltipFn]({
                    trigger: "manual",
                    position: {
                        my: "left center+5",
                        at: "right center"
                    },
                    content: function() {
                        var strIcon = icon === "" ? "" : "<span class='ui-icon " + icon + " pq-tooltip-icon'></span>";
                        return strIcon + msg
                    },
                    open: function(evt, ui) {
                        var tt = ui.tooltip;
                        if (cls) {
                            tt.addClass(cls)
                        }
                        if (style) {
                            var olds = tt.attr("style");
                            tt.attr("style", olds + ";" + style)
                        }
                        if (css) {
                            tt.tooltip.css(css)
                        }
                    }
                })[tooltipFn](tooltipShowFn)
            }
        },
        isValidCell: function(objP) {
            var self = this,
                that = this.that,
                rowData = objP.rowData,
                rowIndx = objP.rowIndx,
                value = objP.value,
                valueDef = objP.valueDef,
                column = objP.column,
                focusInvalid = objP.focusInvalid,
                o = that.options,
                bootstrap = o.bootstrap,
                allowInvalid = objP.allowInvalid,
                dataIndx = column.dataIndx,
                gValid = o.validation,
                gWarn = o.warning,
                EM = o.editModel,
                errorClass = EM.invalidClass,
                warnClass = EM.warnClass,
                ae = document.activeElement;
            if (objP.checkEditable) {
                if (that.isEditable({
                        rowIndx: rowIndx,
                        rowData: rowData,
                        column: column,
                        dataIndx: dataIndx
                    }) === false) {
                    return {
                        valid: true
                    }
                }
            }
            var objvalid = this._isValidCell({
                    column: column,
                    value: value,
                    rowData: rowData
                }),
                _valid = objvalid.valid,
                warn = objvalid.warn,
                msg = objvalid.msg;
            if (!_valid) {
                var pq_valid = $.extend({}, warn ? gWarn : gValid, objvalid.validation),
                    css = pq_valid.css,
                    cls = pq_valid.cls,
                    icon = pq_valid.icon,
                    style = pq_valid.style
            } else {
                if (that.data({
                        rowData: rowData,
                        dataIndx: dataIndx,
                        data: "pq_valid"
                    })) {
                    that.removeClass({
                        rowData: rowData,
                        rowIndx: rowIndx,
                        dataIndx: dataIndx,
                        cls: warnClass + " " + errorClass
                    });
                    that.removeData({
                        rowData: rowData,
                        dataIndx: dataIndx,
                        data: "pq_valid"
                    })
                }
            }
            if (allowInvalid || warn) {
                if (!_valid) {
                    that.addClass({
                        rowData: rowData,
                        rowIndx: rowIndx,
                        dataIndx: dataIndx,
                        cls: warn ? warnClass : errorClass
                    });
                    that.data({
                        rowData: rowData,
                        dataIndx: dataIndx,
                        data: {
                            pq_valid: {
                                css: css,
                                icon: icon,
                                style: style,
                                msg: msg,
                                cls: cls
                            }
                        }
                    });
                    return objvalid
                } else {
                    return {
                        valid: true
                    }
                }
            } else {
                if (!_valid) {
                    if (rowIndx === null) {
                        var objR = that.getRowIndx({
                                rowData: rowData,
                                dataUF: true
                            }),
                            rowIndx = objR.rowIndx;
                        if (rowIndx === null || objR.uf) {
                            objvalid.uf = objR.uf;
                            return objvalid
                        }
                    }
                    if (focusInvalid) {
                        var $td;
                        if (!valueDef) {
                            that.goToPage({
                                rowIndx: rowIndx
                            });
                            var uin = {
                                    rowIndx: rowIndx,
                                    dataIndx: dataIndx
                                },
                                uin = that.normalize(uin);
                            $td = that.getCell(uin);
                            that.scrollCell(uin, function() {
                                self.onScrollCell($td, msg, icon, cls, css, style);
                                that.focus(uin)
                            })
                        } else {
                            if ($(ae).hasClass("pq-editor-focus")) {
                                var indices = o.editModel.indices;
                                if (indices) {
                                    var rowIndx2 = indices.rowIndx,
                                        dataIndx2 = indices.dataIndx;
                                    if (rowIndx !== null && rowIndx !== rowIndx2) {
                                        throw "incorrect usage of isValid rowIndx: " + rowIndx
                                    }
                                    if (dataIndx !== dataIndx2) {
                                        throw "incorrect usage of isValid dataIndx: " + dataIndx
                                    }
                                    that.editCell({
                                        rowIndx: rowIndx2,
                                        dataIndx: dataIndx
                                    })
                                }
                            }
                        }
                        this.onScrollCell($td, msg, icon, cls, css, style)
                    }
                    return objvalid
                }
                if (valueDef) {
                    var cell = that.getEditCell();
                    if (cell && cell.$cell) {
                        var $cell = cell.$cell;
                        $cell.removeAttr("title");
                        try {
                            $cell.tooltip("destroy")
                        } catch (ex) {}
                    }
                }
                return {
                    valid: true
                }
            }
        },
        isValid: function(objP) {
            objP = objP || {};
            var that = this.that,
                allowInvalid = objP.allowInvalid,
                focusInvalid = objP.focusInvalid,
                checkEditable = objP.checkEditable,
                allowInvalid = allowInvalid === null ? false : allowInvalid,
                dataIndx = objP.dataIndx;
            if (dataIndx !== null) {
                var column = that.columns[dataIndx],
                    rowData = objP.rowData || that.getRowData(objP),
                    valueDef = objP.hasOwnProperty("value"),
                    value = valueDef ? objP.value : rowData[dataIndx],
                    objValid = this.isValidCell({
                        rowData: rowData,
                        checkEditable: checkEditable,
                        rowIndx: objP.rowIndx,
                        value: value,
                        valueDef: valueDef,
                        column: column,
                        allowInvalid: allowInvalid,
                        focusInvalid: focusInvalid
                    });
                if (!objValid.valid && !objValid.warn) {
                    return objValid
                } else {
                    return {
                        valid: true
                    }
                }
            } else if (objP.rowIndx !== null || objP.rowIndxPage !== null || objP.rowData !== null) {
                var rowData = objP.rowData || that.getRowData(objP),
                    CM = that.colModel,
                    cells = [],
                    warncells = [];
                for (var i = 0, len = CM.length; i < len; i++) {
                    var column = CM[i],
                        hidden = column.hidden;
                    if (hidden) {
                        continue
                    }
                    var dataIndx = column.dataIndx,
                        value = rowData[dataIndx],
                        objValid = this.isValidCell({
                            rowData: rowData,
                            value: value,
                            column: column,
                            rowIndx: objP.rowIndx,
                            checkEditable: checkEditable,
                            allowInvalid: allowInvalid,
                            focusInvalid: focusInvalid
                        });
                    if (!objValid.valid && !objValid.warn) {
                        if (allowInvalid) {
                            cells.push({
                                rowData: rowData,
                                dataIndx: dataIndx,
                                column: column
                            })
                        } else {
                            return objValid
                        }
                    }
                }
                if (allowInvalid && cells.length) {
                    return {
                        cells: cells,
                        valid: false
                    }
                } else {
                    return {
                        valid: true
                    }
                }
            } else {
                var data = objP.data ? objP.data : that.options.dataModel.data,
                    cells = [];
                if (!data) {
                    return null
                }
                for (var i = 0, len = data.length; i < len; i++) {
                    var rowData = data[i],
                        rowIndx;
                    var objRet = this.isValid({
                        rowData: rowData,
                        rowIndx: rowIndx,
                        checkEditable: checkEditable,
                        allowInvalid: allowInvalid,
                        focusInvalid: focusInvalid
                    });
                    var objRet_cells = objRet.cells;
                    if (allowInvalid === false) {
                        if (!objRet.valid) {
                            return objRet
                        }
                    } else if (objRet_cells && objRet_cells.length) {
                        cells = cells.concat(objRet_cells)
                    }
                }
                if (allowInvalid && cells.length) {
                    return {
                        cells: cells,
                        valid: false
                    }
                } else {
                    return {
                        valid: true
                    }
                }
            }
        }
    }
})(jQuery);
(function($) {
    var fnPG = {};
    fnPG.options = {
        curPage: 0,
        totalPages: 0,
        totalRecords: 0,
        msg: "",
        rPPOptions: [10, 20, 30, 40, 50, 100],
        rPP: 20,
        layout: ["first", "prev", "|", "strPage", "|", "next", "last", "|", "strRpp", "|", "refresh", "|", "strDisplay"]
    };
    fnPG._create = function() {
        var that = this,
            options = that.options,
            $ele = that.element,
            outlineMap = {
                first: that.initButton(options.strFirstPage, "seek-first", "pq-page-first"),
                "|": "<span class='pq-separator'></span>",
                next: that.initButton(options.strNextPage, "seek-next", "pq-page-next"),
                prev: that.initButton(options.strPrevPage, "seek-prev", "pq-page-prev"),
                last: that.initButton(options.strLastPage, "seek-end", "pq-page-last"),
                strPage: that.getPageOf(),
                strRpp: that.getRppOptions(),
                refresh: that.initButton(options.strRefresh, "refresh", "pq-page-refresh"),
                strDisplay: "<span class='pq-page-display'>" + that.getDisplay() + "</span>"
            },
            template = options.layout.map(function(key) {
                return outlineMap[key]
            }).join("");
        that.listeners = {};
        $ele.html(template);
        $ele.addClass("pq-pager");
        that.$first = $ele.find(".pq-page-first");
        that.bindButton(that.$first, function(evt) {
            if (options.curPage > 1) {
                that.onChange(evt, 1)
            }
        });
        that.$prev = $ele.find(".pq-page-prev");
        that.bindButton(that.$prev, function(evt) {
            if (options.curPage > 1) {
                var curPage = options.curPage - 1;
                that.onChange(evt, curPage)
            }
        });
        that.$next = $ele.find(".pq-page-next");
        that.bindButton(that.$next, function(evt) {
            if (options.curPage < options.totalPages) {
                var val = options.curPage + 1;
                that.onChange(evt, val)
            }
        });
        that.$last = $ele.find(".pq-page-last");
        that.bindButton(that.$last, function(evt) {
            if (options.curPage !== options.totalPages) {
                var val = options.totalPages;
                that.onChange(evt, val)
            }
        });
        that.$refresh = $ele.find(".pq-page-refresh");
        that.bindButton(that.$refresh, function(evt) {
            if (that._trigger("beforeRefresh", evt) === false) {
                return false
            }
            that._trigger("refresh", evt)
        });
        that.$display = $ele.find(".pq-page-display");
        that.$select = $ele.find(".pq-page-select").val(options.rPP).on("change", that.onChangeSelect.bind(that));
        that.$totalPages = $ele.find(".pq-page-total");
        that.$curPage = $ele.find(".pq-page-current");
        that.bindCurPage(that.$curPage)
    };
    fnPG._destroy = function() {
        this.element.empty().removeClass("pq-pager").enableSelection();
        this._trigger("destroy")
    };
    fnPG._setOption = function(key, value) {
        if (key === "curPage" || key === "totalPages") {
            value = value * 1
        }
        this._super(key, value)
    };
    fnPG._setOptions = function(options) {
        var key, refresh = false,
            o = this.options;
        for (key in options) {
            var value = options[key],
                type = typeof value;
            if (type === "string" || type === "number") {
                if (value !== o[key]) {
                    this._setOption(key, value);
                    refresh = true
                }
            } else if (typeof value.splice === "function" || $.isPlainObject(value)) {
                if (JSON.stringify(value) !== JSON.stringify(o[key])) {
                    this._setOption(key, value);
                    refresh = true
                }
            } else {
                if (value !== o[key]) {
                    this._setOption(key, value);
                    refresh = true
                }
            }
        }
        if (refresh) {
            this._refresh()
        }
        return this
    };
    $.widget("paramquery.pqPager", fnPG);
    pq.pager = function(selector, options) {
        var $p = $(selector).pqPager(options),
            p = $p.data("paramqueryPqPager") || $p.data("paramquery-pqPager");
        return p
    };
    var _pq = $.paramquery,
        pqPager = _pq.pqPager;
    pqPager.regional = {};
    pqPager.defaults = pqPager.prototype.options;
    $.extend(pqPager.prototype, {
        bindButton: function($ele, fn) {
            $ele.bind("click keydown", function(evt) {
                if (evt.type === "keydown" && evt.keyCode !== $.ui.keyCode.ENTER) {
                    return
                }
                return fn.call(this, evt)
            })
        },
        bindCurPage: function($inp) {
            var that = this,
                options = this.options;
            $inp.bind("keydown", function(evt) {
                if (evt.keyCode === $.ui.keyCode.ENTER) {
                    $(this).trigger("change")
                }
            }).bind("change", function(evt) {
                var $this = $(this),
                    val = $this.val();
                if (isNaN(val) || val < 1) {
                    $this.val(options.curPage);
                    return false
                }
                val = parseInt(val);
                if (val === options.curPage) {
                    return
                }
                if (val > options.totalPages) {
                    $this.val(options.curPage);
                    return false
                }
                if (that.onChange(evt, val) === false) {
                    $this.val(options.curPage);
                    return false
                }
            })
        },
        initButton: function(str, icon, cls) {
            return "<span class='pq-ui-button ui-widget-header " + cls + "' tabindex='0' title='" + str + "'>" + "<span class='ui-icon ui-icon-" + icon + "'></span></span>"
        },
        onChange: function(evt, val) {
            var ui = {
                curPage: val
            };
            if (this._trigger("beforeChange", evt, ui) === false) {
                return false
            }
            this.options.curPage = val;
            this._trigger("change", evt, ui)
        },
        onChangeSelect: function(evt) {
            var $select = $(evt.target),
                that = this,
                val = $select.val() * 1,
                ui = {
                    rPP: val
                };
            if (that._trigger("beforeChange", evt, ui) === false) {
                $select.val(that.options.rPP);
                return false
            }
            that.options.rPP = val;
            that._trigger("change", evt, ui)
        },
        refresh: function() {
            this._destroy();
            this._create()
        },
        _refresh: function() {
            var that = this,
                options = that.options,
                isDisabled = options.curPage >= options.totalPages;
            that.setDisable(that.$next, isDisabled);
            that.setDisable(that.$last, isDisabled);
            isDisabled = options.curPage <= 1;
            that.setDisable(that.$first, isDisabled);
            that.setDisable(that.$prev, isDisabled);
            that.$totalPages.text(options.totalPages);
            that.$curPage.val(options.curPage);
            that.$select.val(options.rPP);
            that.$display.html(this.getDisplay());
            that._trigger("refreshView")
        },
        getDisplay: function() {
            var options = this.options;
            if (options.totalRecords > 0) {
                var rPP = options.rPP,
                    strDisplay = options.strDisplay || "",
                    curPage = options.curPage,
                    totalRecords = options.totalRecords,
                    begIndx = (curPage - 1) * rPP,
                    endIndx = curPage * rPP;
                if (endIndx > totalRecords) {
                    endIndx = totalRecords
                }
                strDisplay = strDisplay.replace("{0}", begIndx + 1);
                strDisplay = strDisplay.replace("{1}", endIndx);
                strDisplay = strDisplay.replace("{2}", totalRecords)
            } else {
                strDisplay = ""
            }
            return strDisplay
        },
        getPageOf: function() {
            var options = this.options;
            return "<span>" + (options.strPage || "").replace("{0}", "<input type='text' value='" + options.curPage + "' tabindex='0' class='pq-page-current ui-corner-all' />").replace("{1}", "<span class='pq-page-total'>" + options.totalPages + "</span>") + "</span>"
        },
        getRppOptions: function() {
            var options = this.options,
                strRpp = options.strRpp || "";
            if (strRpp) {
                var opts = options.rPPOptions,
                    selectStr, selectArr = ["<select class='ui-corner-all pq-page-select' >"],
                    opt;
                if (strRpp.indexOf("{0}") !== -1) {
                    for (var i = 0, len = opts.length; i < len; i++) {
                        opt = opts[i];
                        selectArr.push('<option value="', opt, '">', opt, "</option>")
                    }
                    selectArr.push("</select>");
                    selectStr = selectArr.join("");
                    strRpp = strRpp.replace("{0}", selectStr) + "</span>"
                }
            }
            return "<span class='pq-page-rppoptions'>" + strRpp + "</span>"
        },
        getInstance: function() {
            return {
                pager: this
            }
        },
        _trigger: _pq._trigger,
        on: _pq.on,
        one: _pq.one,
        off: _pq.off,
        setDisable: function($btn, disabled) {
            $btn[disabled ? "addClass" : "removeClass"]("disabled").css("pointer-events", disabled ? "none" : "").attr("tabindex", disabled ? "" : "0")
        }
    })
})(jQuery);
(function($) {
    var cClass = function() {};
    cClass.prototype = {
        belongs: function(evt) {
            if (evt.target === this.that.element[0]) {
                return true
            }
        },
        setTimer: function(fn, interval) {
            var self = this;
            clearTimeout(self._timeID);
            self._timeID = setTimeout(function() {
                fn()
            }, interval)
        }
    };
    var _pq = $.paramquery;
    _pq.cClass = cClass;
    var fni = {
        widgetEventPrefix: "pqgrid"
    };
    fni._create = function() {
        var that = this,
            o = this.options,
            element = this.element,
            DM = o.dataModel,
            bts = o.bootstrap,
            bts_on = bts.on,
            roundCorners = o.roundCorners && !bts_on,
            jui = o.ui,
            SM = o.sortModel;
        $(document).triggerHandler("pqGrid:bootup", {
            instance: this
        });
        this.BS_on = bts_on;
        if (!o.collapsible) {
            o.collapsible = {
                on: false,
                collapsed: false
            }
        }
        if (o.flexHeight) {
            o.height = "flex"
        }
        if (o.flexWidth) {
            o.width = "flex"
        }
        if (DM.sortIndx) {
            SM.on = o.sortable;
            SM.type = DM.sorting;
            var sorter = [],
                sortIndx = DM.sortIndx,
                sortDir = DM.sortDir;
            if ($.isArray(sortIndx)) {
                for (var i = 0; i < sortIndx.length; i++) {
                    var dir = sortDir && sortDir[i] ? sortDir[i] : "up";
                    sorter.push({
                        dataIndx: sortIndx[i],
                        dir: dir
                    })
                }
                SM.single = false
            } else {
                var dir = sortDir ? sortDir : "up";
                sorter.push({
                    dataIndx: sortIndx,
                    dir: dir
                });
                SM.single = true
            }
            SM.sorter = sorter
        }
        this.iRefresh = new _pq.cRefresh(this);
        this.iKeyNav = new _pq.cKeyNav(this);
        this.iValid = new _pq.cValid(this);
        this.tables = [];
        this.$tbl = null;
        this.iCols = new _pq.cColModel(this);
        this.iSort = new _pq.cSort(this);
        this._initTypeColumns();
        element.on("scroll" + this.eventNamespace, function() {
            this.scrollLeft = 0;
            this.scrollTop = 0
        }).on("mousedown" + this.eventNamespace, this._mouseDown.bind(this));
        var jui_grid = bts_on ? bts.grid : jui.grid,
            jui_header_o = bts_on ? "" : jui.header_o,
            jui_bottom = bts_on ? "" : jui.bottom,
            jui_top = bts_on ? bts.top : jui.top;
        element.empty().attr("role", "grid").addClass("pq-grid pq-theme " + jui_grid + " " + (roundCorners ? " ui-corner-all" : "")).html(["<div class='pq-grid-top ", jui_top, " ", roundCorners ? " ui-corner-top" : "", "'>", "<div class='pq-grid-title", roundCorners ? " ui-corner-top" : "", "'>&nbsp;</div>", "</div>", "<div class='pq-grid-center-o'>", "<div class='pq-tool-panel' style='display:", o.toolPanel.show ? "" : "none", ";'></div>", "<div class='pq-grid-center' >", "<div class='pq-header-outer ", jui_header_o, "'></div>", "<div class='pq-body-outer' tabindex='0' ></div>", "<div class='pq-summary-outer' ></div>", "</div>", "<div style='clear:both;'></div>", "</div>", "<div class='pq-grid-bottom ", jui_bottom, " ", roundCorners ? " ui-corner-bottom" : "", "'>", "<div class='pq-grid-footer'></div>", "</div>"].join(""));
        this.$bottom = $(".pq-grid-bottom", element);
        this.$summary = $(".pq-summary-outer", element);
        this.$toolPanel = element.find(".pq-tool-panel");
        this.$top = $("div.pq-grid-top", element);
        if (!o.showTop) {
            this.$top.css("display", "none")
        }
        this.$title = $("div.pq-grid-title", element);
        if (!o.showTitle) {
            this.$title.css("display", "none")
        }
        var $grid_center = this.$grid_center = $(".pq-grid-center", element).on("scroll", function() {
            this.scrollTop = 0
        });
        this.addTouch();
        var $header = this.$header = $(".pq-header-outer", $grid_center).on("scroll", function() {
            this.scrollTop = 0;
            this.scrollLeft = 0
        });
        this.iHeader = new _pq.cHeader(this, $header);
        this.$footer = $(".pq-grid-footer", element);
        var $cont = this.$cont = $(".pq-body-outer", $grid_center);
        this.iRenderB = new pq.cRenderBody(that, {
            $center: $grid_center,
            $b: $cont,
            $sum: this.$summary,
            header: true,
            $h: this.$header
        });
        this._trigger("render", null, {
            dataModel: this.options.dataModel,
            colModel: this.colModel
        });
        $header.on("contextmenu", ".pq-grid-col", function(evt) {
            if (that.evtBelongs(evt)) {
                return that._onHeadRightClick(evt)
            }
        });
        $cont.on("click", ".pq-grid-cell,.pq-grid-number-cell", function(evt) {
            if ($.data(evt.target, that.widgetName + ".preventClickEvent") === true) {
                return
            }
            if (that.evtBelongs(evt)) {
                return that._onClickCell(evt)
            }
        }).on("contextmenu", ".pq-grid-cell,.pq-grid-number-cell", function(evt) {
            if (that.evtBelongs(evt)) {
                return that._onRightClick(evt)
            }
        }).on("dblclick", ".pq-grid-cell", function(evt) {
            if (that.evtBelongs(evt)) {
                return that._onDblClickCell(evt)
            }
        });
        $cont.on("focusout", function() {
            that.onblur()
        }).on("focus", function(evt) {
            that.onfocus(evt)
        }).on("mousedown", that._onMouseDown(that)).on("change", that._onChange(that)).on("mouseenter", ".pq-grid-cell", that._onCellMouseEnter(that)).on("mouseenter", ".pq-grid-row", that._onRowMouseEnter(that)).on("mouseleave", ".pq-grid-cell", that._onCellMouseLeave(that)).on("mouseleave", ".pq-grid-row", that._onRowMouseLeave(that)).on("keyup", that._onKeyUp(that));
        if (!o.selectionModel["native"]) {
            this.disableSelection()
        }
        $grid_center.bind("keydown.pq-grid", that._onKeyPressDown(that));
        this._refreshTitle();
        this.iRows = new _pq.cRows(this);
        this.generateLoading();
        this._initPager();
        this._refreshResizable();
        this._refreshDraggable();
        this.iResizeColumns = new _pq.cResizeColumns(this)
    };
    fni.addTouch = function() {
        var firstTap, secondTap, ele;
        if ("ontouchend" in document) {
            ele = this.$grid_center[0];
            ele.addEventListener("touchstart", function(evt) {
                var target = evt.target,
                    touch = evt.changedTouches[0],
                    e = $.Event("mousedown", touch);
                $(target).trigger(e);
                if (!firstTap) {
                    firstTap = {
                        x: touch.pageX,
                        y: touch.pageY,
                        target: target
                    };
                    setTimeout(function() {
                        firstTap = null
                    }, 400)
                } else if (target && target === firstTap.target) {
                    var x = firstTap.x - touch.pageX,
                        y = firstTap.y - touch.pageY,
                        dist = Math.sqrt(x * x + y * y);
                    if (dist <= 12) {
                        secondTap = firstTap;
                        setTimeout(function() {
                            secondTap = null
                        }, 500)
                    }
                }
            }, true);
            ele.addEventListener("touchend", function(evt) {
                var target = evt.target;
                if (secondTap && target === secondTap.target) {
                    $(target).trigger("dblclick", evt)
                }
            })
        }
    };
    fni._mouseDown = function(evt) {
        var that = this;
        if ($(evt.target).closest(".pq-editor-focus").length) {
            this._blurEditMode = true;
            window.setTimeout(function() {
                that._blurEditMode = false
            }, 0);
            return
        }
    };
    fni.destroy = function() {
        this._trigger("destroy");
        this._super();
        $(window).off("resize" + this.eventNamespace);
        for (var key in this) {
            delete this[key]
        }
        this.options = undefined;
        $.fragments = {}
    };
    fni._setOption = function(key, value) {
        var options = this.options,
            a = function() {
                options[key] = value
            },
            iRB = this.iRenderB,
            iRS = this.iRenderSum,
            iRH = this.iRenderHead,
            c = function(val) {
                return val ? "addClass" : "removeClass"
            },
            cls, DM = options.dataModel;
        if (key === "height") {
            a();
            this._refreshResizable()
        } else if (key === "width") {
            a();
            this._refreshResizable()
        } else if (key === "title") {
            a();
            this._refreshTitle()
        } else if (key === "roundCorners") {
            a();
            var addClass = c(value);
            this.element[addClass]("ui-corner-all");
            this.$top[addClass]("ui-corner-top");
            this.$bottom[addClass]("ui-corner-bottom")
        } else if (key === "freezeCols") {
            value = parseInt(value);
            if (!isNaN(value) && value >= 0 && value <= this.colModel.length - 2) {
                a()
            }
        } else if (key === "freezeRows") {
            value = parseInt(value);
            if (!isNaN(value) && value >= 0) {
                a()
            }
        } else if (key === "resizable") {
            a();
            this._refreshResizable()
        } else if (key === "draggable") {
            a();
            this._refreshDraggable()
        } else if (key === "dataModel") {
            if (value.data !== DM.data) {
                if (DM.dataUF) {
                    DM.dataUF.length = 0
                }
            }
            a()
        } else if (key === "groupModel") {
            throw "use groupOption() to set groupModel options."
        } else if (key === "treeModel") {
            throw "use treeOption() to set treeModel options."
        } else if (key === "pageModel") {
            a()
        } else if (key === "colModel" || key === "columnTemplate") {
            a();
            this.iCols.init()
        } else if (key === "disabled") {
            this._super(key, value);
            if (value === true) {
                this._disable()
            } else {
                this._enable()
            }
        } else if (key === "strLoading") {
            a();
            this._refreshLoadingString()
        } else if (key === "showTop") {
            a();
            this.$top.css("display", value ? "" : "none")
        } else if (key === "showTitle") {
            a();
            this.$title.css("display", value ? "" : "none")
        } else if (key === "showToolbar") {
            a();
            var $tb = this._toolbar.widget();
            $tb.css("display", value ? "" : "none")
        } else if (key === "collapsible") {
            a();
            this._createCollapse()
        } else if (key === "showBottom") {
            a();
            this.$bottom.css("display", value ? "" : "none")
        } else if (key === "wrap" || key === "hwrap") {
            (key === "wrap" ? iRB.$tbl.add(iRS.$tbl) : iRH.$tbl)[c(!value)]("pq-no-wrap")
        } else if (key === "rowBorders") {
            a();
            addClass = c(value);
            cls = "pq-td-border-top";
            iRB.$tbl[addClass](cls);
            iRS.$tbl[addClass](cls)
        } else if (key === "columnBorders") {
            a();
            addClass = c(value);
            cls = "pq-td-border-right";
            iRB.$tbl[addClass](cls);
            iRS.$tbl[addClass](cls)
        } else {
            a()
        }
        return this
    };
    fni.options = {
        cancel: "input,textarea,button,select,option,.pq-no-capture,.ui-resizable-handle",
        trigger: false,
        bootstrap: {
            on: false,
            thead: "table table-striped table-condensed table-bordered",
            tbody: "table table-condensed",
            grid: "panel panel-default",
            top: "",
            btn: "btn btn-default",
            groupModel: {
                icon: ["glyphicon-triangle-bottom", "glyphicon-triangle-right"]
            },
            header_active: "active"
        },
        ui: {
            on: true,
            grid: "ui-widget ui-widget-content",
            top: "ui-widget-header",
            bottom: "ui-widget-header",
            header_o: "ui-widget-header",
            header: "ui-state-default",
            header_active: "ui-state-active"
        },
        collapsible: {
            on: true,
            toggle: true,
            collapsed: false,
            _collapsed: false,
            refreshAfterExpand: true,
            css: {
                zIndex: 1e3
            }
        },
        colModel: null,
        columnBorders: true,
        dataModel: {
            data: [],
            dataUF: [],
            cache: false,
            dataType: "JSON",
            location: "local",
            sorting: "local",
            sortDir: "up",
            method: "GET"
        },
        direction: "",
        draggable: false,
        editable: true,
        editModel: {
            cellBorderWidth: 0,
            pressToEdit: true,
            clicksToEdit: 2,
            filterKeys: true,
            keyUpDown: true,
            reInt: /^([\-]?[1-9][0-9]*|[\-]?[0-9]?)$/,
            reFloat: /^[\-]?[0-9]*\.?[0-9]*$/,
            onBlur: "validate",
            saveKey: $.ui.keyCode.ENTER,
            onSave: "nextFocus",
            onTab: "nextFocus",
            allowInvalid: false,
            invalidClass: "pq-cell-red-tr pq-has-tooltip",
            warnClass: "pq-cell-blue-tr pq-has-tooltip",
            validate: true
        },
        editor: {
            select: false,
            type: "textbox"
        },
        summaryOptions: {
            number: "avg,max,min,stdev,stdevp,sum",
            date: "count,max,min",
            string: "count"
        },
        summaryTitle: {
            avg: "Avg: {0}",
            count: "Count: {0}",
            max: "Max: {0}",
            min: "Min: {0}",
            stdev: "Stdev: {0}",
            stdevp: "Stdevp: {0}",
            sum: "Sum: {0}"
        },
        validation: {
            icon: "ui-icon-alert",
            cls: "ui-state-error",
            style: "padding:3px 10px;"
        },
        warning: {
            icon: "ui-icon-info",
            cls: "",
            style: "padding:3px 10px;"
        },
        freezeCols: 0,
        freezeRows: 0,
        freezeBorders: true,
        calcDataIndxFromColIndx: true,
        height: 400,
        hoverMode: "null",
        maxColWidth: 2e3,
        minColWidth: 50,
        minWidth: 100,
        menuUI: {
            tabs: ["hideCols", "filter"],
            buttons: ["clear", "ok"],
            gridOptions: {
                autoRow: false,
                copyModel: {
                    render: true
                },
                editable: function(ui) {
                    return !ui.rowData.pq_disabled
                },
                fillHandle: "",
                filterModel: {
                    header: true,
                    on: true
                },
                hoverMode: "row",
                hwrap: false,
                rowBorders: false,
                rowHt: 22,
                rowHtHead: 23,
                scrollModel: {
                    autoFit: true
                },
                showTop: false,
                height: 300,
                wrap: false
            }
        },
        numberCell: {
            width: 30,
            title: "",
            resizable: true,
            minWidth: 30,
            maxWidth: 100,
            show: true
        },
        pageModel: {
            curPage: 1,
            totalPages: 0,
            rPP: 10,
            rPPOptions: [10, 20, 50, 100]
        },
        resizable: false,
        roundCorners: true,
        rowBorders: true,
        autoRow: true,
        scrollModel: {
            autoFit: false
        },
        selectionModel: {
            type: "cell",
            onTab: "nextFocus",
            row: true,
            mode: "block"
        },
        showBottom: true,
        showHeader: true,
        showTitle: true,
        showToolbar: true,
        showTop: true,
        sortable: true,
        sql: false,
        stripeRows: true,
        title: "&nbsp;",
        treeModel: null,
        width: "auto",
        wrap: true,
        hwrap: true
    };
    $.widget("paramquery._pqGrid", fni);
    var fn = _pq._pqGrid.prototype;
    fn.refreshCM = function(CM, ui) {
        if (CM) {
            this.options.colModel = CM
        }
        this.iCols.init(ui)
    };
    fn.evtBelongs = function(evt) {
        return $(evt.target).closest(".pq-grid")[0] === this.element[0]
    };
    fn.readCell = function(rowData, column, iMerge, ri, ci) {
        if (iMerge && iMerge.isRootCell(ri, ci, "o") === false) {
            return undefined
        }
        return rowData[column.dataIndx]
    };
    fn.saveCell = function(rowData, column, val) {
        var dataIndx = column.dataIndx;
        rowData[dataIndx] = val
    };
    fn._destroyResizable = function() {
        var ele = this.element,
            data = ele.data();
        if (data.resizable || data.uiResizable || data["ui-resizable"]) {
            ele.resizable("destroy")
        }
    };
    fn._disable = function() {
        if (this.$disable === null) this.$disable = $("<div class='pq-grid-disable'></div>").css("opacity", .2).appendTo(this.element)
    };
    fn._enable = function() {
        if (this.$disable) {
            this.element[0].removeChild(this.$disable[0]);
            this.$disable = null
        }
    };
    fn._destroy = function() {
        if (this.loading) {
            this.xhr.abort()
        }
        this._destroyResizable();
        this._destroyDraggable();
        this.element.off(this.eventNamespace);
        $(window).unbind(this.eventNamespace);
        $(document).unbind(this.eventNamespace);
        this.element.empty().css("height", "").css("width", "").removeClass("pq-grid ui-widget ui-widget-content ui-corner-all").removeData()
    };
    fn.addColumn = function(ui) {
        var columns = ui.columns || [ui.column],
            o = this.options,
            CM = o.colModel,
            CM2 = CM.concat(columns);
        this.refreshCM(CM2);
        this._trigger("addColumn");
        if (ui.refresh !== false) {
            this.refresh()
        }
    };
    fn.deleteColumn = function(ui) {
        var colList = ui.colList || [{
                colIndx: ui.colIndx
            }],
            history = ui.history !== false,
            o = this.options,
            CM = o.colModel;
        for (var i = colList.length - 1; i >= 0; i--) {
            var co = colList[i],
                colIndx = co.colIndx,
                column = CM.splice(colIndx, 1)[0];
            co.column = column
        }
        this.iCols.init();
        if (history) {
            this.iHistory.increment();
            colList.type = "delete";
            this.iHistory.push({
                colList: colList
            })
        }
        this._trigger("deleteColumn", null, {
            colList: colList
        });
        if (ui.refresh !== false) {
            this.refreshView()
        }
    };
    fn._onKeyUp = function(that) {
        return function(evt) {
            if (that.evtBelongs(evt)) {
                that._trigger("keyUp", evt, null)
            }
        }
    };
    fn.onKeyPressDown = function(evt) {
        var that = this,
            $header = $(evt.target).closest(".pq-header-outer");
        if ($header.length) {
            return that._trigger("headerKeyDown", evt, null)
        } else {
            if (that.iKeyNav.bodyKeyPressDown(evt) === false) {
                return
            }
            if (that._trigger("keyDown", evt, null) === false) {
                return
            }
        }
    };
    fn._onKeyPressDown = function(that) {
        return function(evt) {
            if (that.evtBelongs(evt)) {
                that.onKeyPressDown(evt, that)
            }
        }
    };
    fn.collapse = function(objP) {
        var that = this,
            ele = this.element,
            o = this.options,
            CP = o.collapsible,
            $icon = CP.$collapse.children("span"),
            postCollapse = function() {
                ele.css("overflow", "hidden");
                $icon.addClass("ui-icon-circle-triangle-s").removeClass("ui-icon-circle-triangle-n");
                if (ele.hasClass("ui-resizable")) {
                    ele.resizable("destroy")
                }
                if (that._toolbar) that._toolbar.disable();
                CP.collapsed = true;
                CP._collapsed = true;
                CP.animating = false;
                that._trigger("collapse")
            };
        objP = objP ? objP : {};
        if (CP._collapsed) {
            return false
        }
        CP.htCapture = ele.height();
        if (objP.animate === false) {
            ele.height(23);
            postCollapse()
        } else {
            CP.animating = true;
            ele.animate({
                height: "23px"
            }, function() {
                postCollapse()
            })
        }
    };
    fn.expand = function(objP) {
        var that = this,
            ele = this.element,
            o = this.options,
            CP = o.collapsible,
            htCapture = CP.htCapture,
            $icon = CP.$collapse.children("span"),
            postExpand = function() {
                ele.css("overflow", "");
                CP._collapsed = false;
                CP.collapsed = false;
                that._refreshResizable();
                if (CP.refreshAfterExpand) {
                    that.refresh()
                }
                $icon.addClass("ui-icon-circle-triangle-n").removeClass("ui-icon-circle-triangle-s");
                if (that._toolbar) that._toolbar.enable();
                CP.animating = false;
                that._trigger("expand")
            };
        objP = objP ? objP : {};
        if (CP._collapsed === false) {
            return false
        }
        if (objP.animate === false) {
            ele.height(htCapture);
            postExpand()
        } else {
            CP.animating = true;
            ele.animate({
                height: htCapture
            }, function() {
                postExpand()
            })
        }
    };

    function createButton(icon) {
        return "<span class='btn btn-xs glyphicon glyphicon-" + icon + "' ></span>"
    }

    function createUIButton(icon) {
        return "<span class='ui-widget-header pq-ui-button'><span class='ui-icon ui-icon-" + icon + "'></span></span>"
    }
    fn._createCollapse = function() {
        var that = this,
            $top = this.$top,
            o = this.options,
            BS_on = this.BS_on,
            CP = o.collapsible;
        if (!CP.$stripe) {
            var $stripe = $(["<div class='pq-slider-icon pq-no-capture'  >", "</div>"].join("")).appendTo($top);
            CP.$stripe = $stripe
        }
        if (CP.on) {
            if (!CP.$collapse) {
                CP.$collapse = $(BS_on ? createButton("collapse-down") : createUIButton("circle-triangle-n")).appendTo(CP.$stripe).click(function(evt) {
                    if (CP.collapsed) {
                        that.expand()
                    } else {
                        that.collapse()
                    }
                })
            }
        } else if (CP.$collapse) {
            CP.$collapse.remove();
            delete CP.$collapse
        }
        if (CP.collapsed && !CP._collapsed) {
            that.collapse({
                animate: false
            })
        } else if (!CP.collapsed && CP._collapsed) {
            that.expand({
                animate: false
            })
        }
        if (CP.toggle) {
            if (!CP.$toggle) {
                CP.$toggle = $(BS_on ? createButton("fullscreen") : createUIButton("arrow-4-diag")).prependTo(CP.$stripe).click(function(evt) {
                    that.toggle()
                })
            }
        } else if (CP.$toggle) {
            CP.$toggle.remove();
            delete CP.$toggle
        }
    };
    fn.toggle = function() {
        var o = this.options,
            CP = o.collapsible,
            $grid = this.element,
            state, maxim = this._maxim,
            state = maxim ? "min" : "max",
            $doc = $(document.body);
        if (this._trigger("beforeToggle", null, {
                state: state
            }) === false) {
            return false
        }
        if (state === "min") {
            var eleObj = maxim.eleObj,
                docObj = maxim.docObj;
            this.option({
                height: eleObj.height,
                width: eleObj.width,
                maxHeight: eleObj.maxHeight,
                maxWidth: eleObj.maxWidth
            });
            $grid[0].style.cssText = eleObj.cssText;
            $doc[0].style.cssText = docObj.cssText;
            $("html").css({
                overflow: "visible"
            });
            window.scrollTo(docObj.scrollLeft, docObj.scrollTop);
            this._maxim = null
        } else {
            var eleObj = {
                height: o.height,
                width: o.width,
                cssText: $grid[0].style.cssText,
                maxHeight: o.maxHeight,
                maxWidth: o.maxWidth
            };
            this.option({
                height: "100%",
                width: "100%",
                maxHeight: null,
                maxWidth: null
            });
            $grid.css($.extend({
                position: "fixed",
                left: 0,
                top: 0,
                margin: 0
            }, CP.css));
            var docObj = {
                scrollLeft: $(window).scrollLeft(),
                scrollTop: $(window).scrollTop(),
                cssText: $doc[0].style.cssText
            };
            $doc.css({
                height: 0,
                width: 0,
                overflow: "hidden",
                position: "static"
            });
            $("html").css({
                overflow: "hidden"
            });
            window.scrollTo(0, 0);
            this._maxim = {
                eleObj: eleObj,
                docObj: docObj
            }
        }
        this._trigger("toggle", null, {
            state: state
        });
        this._refreshResizable();
        this.refresh();
        $(window).trigger("resize", {
            $grid: $grid,
            state: state
        })
    };
    fn._mousePQUp = function(evt) {
        $(document).unbind("mouseup" + this.eventNamespace, this._mousePQUpDelegate);
        this._trigger("mousePQUp", evt, null)
    };
    fn._onDblClickCell = function(evt) {
        var that = this,
            $td = $(evt.currentTarget),
            obj = that.getCellIndices({
                $td: $td
            });
        obj.$td = $td;
        if (that._trigger("cellDblClick", evt, obj) === false) {
            return
        }
        if (that.options.editModel.clicksToEdit > 1 && that.isEditable(obj)) {
            that.editCell(obj)
        }
        obj.$tr = $td.closest(".pq-grid-row");
        that._trigger("rowDblClick", evt, obj)
    };
    fn.getValueFromDataType = function(val, dataType, validation) {
        if ((val + "")[0] === "=") {
            return val
        }
        var val2;
        if (dataType === "date") {
            val2 = Date.parse(val);
            if (isNaN(val2)) {
                return
            } else {
                if (validation) {
                    return val2
                } else {
                    return val
                }
            }
        } else if (dataType === "integer") {
            val2 = parseInt(val)
        } else if (dataType === "float") {
            val2 = parseFloat(val)
        } else if (dataType === "bool") {
            if (val === null) {
                return val
            }
            val2 = $.trim(val).toLowerCase();
            if (val2.length === 0) {
                return null
            }
            if (val2 === "true" || val2 === "yes" || val2 === "1") {
                return true
            } else if (val2 === "false" || val2 === "no" || val2 === "0") {
                return false
            } else {
                return Boolean(val2)
            }
        } else if (dataType === "object") {
            return val
        } else {
            return val === null ? val : $.trim(val)
        }
        if (isNaN(val2) || val2 === null) {
            if (val === null) {
                return val
            } else {
                return null
            }
        } else {
            return val2
        }
    };
    fn.isValid = function(objP) {
        return this.iValid.isValid(objP)
    };
    fn.isValidChange = function(ui) {
        ui = ui || {};
        var changes = this.getChanges(),
            al = changes.addList,
            ul = changes.updateList,
            list = ul.concat(al);
        ui.data = list;
        return this.isValid(ui)
    };
    fn.isEditableRow = function(objP) {
        var gEditable = this.options.editable;
        return typeof gEditable === "function" ? gEditable.call(this, this.normalize(objP)) : gEditable
    };
    fn.isEditableCell = function(ui) {
        var objP, column = ui.column,
            cEditable;
        if (!column) {
            objP = this.normalize(ui);
            column = objP.column
        }
        cEditable = column.editable;
        if (cEditable !== null) {
            if (typeof cEditable === "function") {
                objP = objP || this.normalize(ui);
                return this.callFn(cEditable, objP)
            } else {
                return cEditable
            }
        }
    };
    fn.isEditable = function(ui) {
        var ret = this.isEditableCell(ui);
        return ret === null ? this.isEditableRow(ui) : ret
    };
    fn._onMouseDownCont = function(evt) {
        var that = this,
            pdata, cont;
        that.blurEditor({
            blurIfFocus: true
        });
        that._mousePQUpDelegate = function(event) {
            return that._mousePQUp(event)
        };
        $(document).bind("mouseup" + that.eventNamespace, that._mousePQUpDelegate);
        pdata = that.pdata;
        if (!pdata || !pdata.length) {
            cont = that.$cont[0];
            cont.setAttribute("tabindex", 0);
            cont.focus()
        }
    };
    fn._onMouseDown = function(that) {
        return function(evt) {
            if ((!evt.which || evt.which === 1) && that.evtBelongs(evt)) {
                var ret, $target = $(evt.target),
                    $tr, $td = $target.closest(".pq-grid-cell,.pq-grid-number-cell");
                if ($td.length) {
                    evt.currentTarget = $td[0];
                    ret = that._onMouseDownCell(evt)
                }
                if (evt.isPropagationStopped()) {
                    return
                }
                $tr = $target.closest(".pq-grid-row");
                if ($tr.length) {
                    evt.currentTarget = $tr[0];
                    ret = that._onMouseDownRow(evt)
                }
                if (evt.isPropagationStopped()) {
                    return
                }
                that._onMouseDownCont(evt)
            }
        }
    };
    fn._onMouseDownCell = function(evt) {
        var that = this,
            $td = $(evt.currentTarget),
            _obj = that.getCellIndices({
                $td: $td
            }),
            objP;
        if (_obj.rowIndx !== null) {
            objP = this.iMerge.getRootCellO(_obj.rowIndx, _obj.colIndx, true);
            objP.$td = $td;
            that._trigger("cellMouseDown", evt, objP)
        }
    };
    fn._onMouseDownRow = function(evt) {
        var that = this,
            $tr = $(evt.currentTarget),
            objP = that.getRowIndx({
                $tr: $tr
            });
        objP.$tr = $tr;
        that._trigger("rowMouseDown", evt, objP)
    };
    fn._onCellMouseEnter = function(that) {
        return function(evt) {
            if (that.evtBelongs(evt)) {
                var $td = $(this),
                    o = that.options,
                    objP = that.getCellIndices({
                        $td: $td
                    });
                if (objP.rowIndx === null || objP.colIndx === null) {
                    return
                }
                if (that._trigger("cellMouseEnter", evt, objP) === false) {
                    return
                }
                if (o.hoverMode === "cell") {
                    that.highlightCell($td)
                }
                return true
            }
        }
    };
    fn._onChange = function(that) {
        var clickEvt, changeEvt, ui;
        that.on("cellClickDone", function(evt) {
            clickEvt = evt.originalEvent;
            triggerEvt()
        });

        function triggerEvt() {
            if (clickEvt && changeEvt && changeEvt.target === clickEvt.target) {
                var key, keys = {
                    ctrlKey: 0,
                    metaKey: 0,
                    shiftKey: 0,
                    altKey: 0
                };
                for (key in keys) {
                    changeEvt[key] = clickEvt[key]
                }
                that._trigger("valChange", changeEvt, ui);
                changeEvt = clickEvt = undefined
            }
        }
        return function(evt) {
            if (that.evtBelongs(evt)) {
                var $inp = $(evt.target),
                    $td = $inp.closest(".pq-grid-cell");
                if ($td.length) {
                    ui = that.getCellIndices({
                        $td: $td
                    });
                    ui = that.normalize(ui);
                    ui.input = $inp[0];
                    changeEvt = evt;
                    triggerEvt()
                }
            }
        }
    };
    fn._onRowMouseEnter = function(that) {
        return function(evt) {
            if (that.evtBelongs(evt)) {
                var $tr = $(this),
                    o = that.options,
                    objRI = that.getRowIndx({
                        $tr: $tr
                    }),
                    rowIndxPage = objRI.rowIndxPage;
                if (that._trigger("rowMouseEnter", evt, objRI) === false) {
                    return
                }
                if (o.hoverMode === "row") {
                    that.highlightRow(rowIndxPage)
                }
                return true
            }
        }
    };
    fn._onCellMouseLeave = function(that) {
        return function(evt) {
            if (that.evtBelongs(evt)) {
                var $td = $(this);
                if (that.options.hoverMode === "cell") {
                    that.unHighlightCell($td)
                }
            }
        }
    };
    fn._onRowMouseLeave = function(that) {
        return function(evt) {
            if (that.evtBelongs(evt)) {
                var $tr = $(this),
                    obj = that.getRowIndx({
                        $tr: $tr
                    }),
                    rowIndxPage = obj.rowIndxPage;
                if (that._trigger("rowMouseLeave", evt, {
                        $tr: $tr,
                        rowIndx: obj.rowIndx,
                        rowIndxPage: rowIndxPage
                    }) === false) {
                    return
                }
                if (that.options.hoverMode === "row") {
                    that.unHighlightRow(rowIndxPage)
                }
            }
        }
    };
    fn.enableSelection = function() {
        this.element.removeClass("pq-disable-select").off("selectstart" + this.eventNamespace)
    };
    fn.disableSelection = function() {
        this.element.addClass("pq-disable-select").on("selectstart" + this.eventNamespace, function(evt) {
            var target = evt.target;
            if (!target) {
                return
            }
            var $target = $(evt.target);
            if ($target.is("input,textarea,select")) {
                return true
            } else if ($target.closest(".pq-native-select").length) {
                return true
            } else {
                evt.preventDefault()
            }
        })
    };
    fn._onClickCell = function(evt) {
        var that = this,
            o = that.options,
            EM = o.editModel,
            $td = $(evt.currentTarget),
            __obj = that.getCellIndices({
                $td: $td
            }),
            objP = that.normalize(__obj),
            colIndx = objP.colIndx;
        objP.$td = $td;
        objP.evt = evt;
        if (that._trigger("beforeCellClick", evt, objP) === false) {
            return
        }
        that._trigger("cellClick", evt, objP);
        if (colIndx === null || colIndx < 0) {
            return
        }
        if (EM.clicksToEdit === 1 && that.isEditable(objP)) {
            that.editCell(objP)
        }
        objP.$tr = $td.closest(".pq-grid-row");
        that._trigger("rowClick", evt, objP)
    };
    fn._onHeadRightClick = function(evt) {
        var $td = $(evt.currentTarget),
            arr = this.iRenderB.getCellIndx($td[0]),
            ri = arr[0],
            ci = arr[1],
            hc = this.headerCells,
            row = hc[ri] || hc[ri - 1],
            col = row[ci],
            obj = {
                rowIndx: ri,
                colIndx: ci,
                column: col,
                $th: $td,
                filterRow: !hc[ri]
            };
        this._trigger("headRightClick", evt, obj)
    };
    fn._onRightClick = function(evt) {
        var $td = $(evt.currentTarget),
            objP = this.getCellIndices({
                $td: $td
            });
        objP.$td = $td;
        if (this._trigger("cellRightClick", evt, objP) === false) {
            return
        }
        objP.$tr = $td.closest(".pq-grid-row");
        this._trigger("rowRightClick", evt, objP)
    };
    fn.highlightCell = function($td) {
        $td.addClass("pq-grid-cell-hover ui-state-hover")
    };
    fn.unHighlightCell = function($td) {
        $td.removeClass("pq-grid-cell-hover ui-state-hover")
    };
    fn.highlightRow = function(varr) {
        if (isNaN(varr)) {} else {
            var $tr = this.getRow({
                rowIndxPage: varr
            });
            if ($tr) $tr.addClass("pq-grid-row-hover ui-state-hover")
        }
    };
    fn.unHighlightRow = function(varr) {
        if (isNaN(varr)) {} else {
            var $tr = this.getRow({
                rowIndxPage: varr
            });
            if ($tr) $tr.removeClass("pq-grid-row-hover ui-state-hover")
        }
    };
    fn._getCreateEventData = function() {
        return {
            dataModel: this.options.dataModel,
            data: this.pdata,
            colModel: this.options.colModel
        }
    };
    fn._initPager = function() {
        var that = this,
            o = that.options,
            PM = o.pageModel;
        if (PM.type) {
            var obj2 = {
                bootstrap: o.bootstrap,
                change: function(evt, ui) {
                    that.blurEditor({
                        force: true
                    });
                    var DM = that.options.pageModel;
                    if (ui.curPage !== undefined) {
                        DM.prevPage = DM.curPage;
                        DM.curPage = ui.curPage
                    }
                    if (ui.rPP !== undefined) DM.rPP = ui.rPP;
                    if (DM.type === "remote") {
                        that.remoteRequest({
                            callback: function() {
                                that._onDataAvailable({
                                    apply: true,
                                    header: false
                                })
                            }
                        })
                    } else {
                        that.refreshView({
                            header: false,
                            source: "pager"
                        })
                    }
                },
                refresh: function(evt) {
                    that.refreshDataAndView()
                }
            };
            obj2 = $.extend(obj2, PM);
            this.pagerW = pq.pager(PM.appendTo ? PM.appendTo : this.$footer, obj2).on("destroy", function() {
                delete that.pagerW
            })
        } else {}
    };
    fn.generateLoading = function() {
        if (this.$loading) {
            this.$loading.remove()
        }
        this.$loading = $("<div class='pq-loading'></div>").appendTo(this.element);
        $(["<div class='pq-loading-bg'></div><div class='pq-loading-mask ui-state-highlight'><div>", this.options.strLoading, "...</div></div>"].join("")).appendTo(this.$loading);
        this.$loading.find("div.pq-loading-bg").css("opacity", .2)
    };
    fn._refreshLoadingString = function() {
        this.$loading.find("div.pq-loading-mask").children("div").html(this.options.strLoading)
    };
    fn.showLoading = function() {
        if (this.showLoadingCounter === null) {
            this.showLoadingCounter = 0
        }
        this.showLoadingCounter++;
        this.$loading.show()
    };
    fn.hideLoading = function() {
        if (this.showLoadingCounter > 0) {
            this.showLoadingCounter--
        }
        if (!this.showLoadingCounter) {
            this.$loading.hide()
        }
    };
    fn.getTotalRows = function() {
        var o = this.options,
            DM = o.dataModel,
            data = DM.data || [],
            dataUF = DM.dataUF || [],
            PM = o.pageModel;
        if (PM.location === "remote") {
            return PM.totalRecords
        } else {
            return data.length + dataUF.length
        }
    };
    fn.refreshDataFromDataModel = function(obj) {
        obj = obj || {};
        var that = this,
            thisOptions = that.options,
            DM = thisOptions.dataModel,
            PM = thisOptions.pageModel,
            DMdata = DM.data,
            begIndx, endIndx, totalPages, totalRecords, paging = PM.type,
            rowIndxOffset, qTriggers = that._queueATriggers;
        for (var key in qTriggers) {
            var t = qTriggers[key];
            delete qTriggers[key];
            that._trigger(key, t.evt, t.ui)
        }
        that._trigger("beforeRefreshData", null, {});
        if (paging === "local") {
            totalRecords = PM.totalRecords = DMdata.length;
            PM.totalPages = totalPages = Math.ceil(totalRecords / PM.rPP);
            if (PM.curPage > totalPages) {
                PM.curPage = totalPages
            }
            if (totalPages && !PM.curPage) {
                PM.curPage = 1
            }
            begIndx = (PM.curPage - 1) * PM.rPP;
            begIndx = begIndx >= 0 ? begIndx : 0;
            endIndx = PM.curPage * PM.rPP;
            if (endIndx > DMdata.length) {
                endIndx = DMdata.length
            }
            that.pdata = DMdata.slice(begIndx, endIndx);
            rowIndxOffset = begIndx
        } else if (paging === "remote") {
            PM.totalPages = totalPages = Math.ceil(PM.totalRecords / PM.rPP);
            if (PM.curPage > totalPages) {
                PM.curPage = totalPages
            }
            if (totalPages && !PM.curPage) {
                PM.curPage = 1
            }
            var endIndx = PM.rPP;
            if (endIndx > DMdata.length) {
                endIndx = DMdata.length
            }
            that.pdata = DMdata.slice(0, endIndx);
            rowIndxOffset = PM.rPP * (PM.curPage - 1)
        } else {
            if (thisOptions.backwardCompat) {
                that.pdata = DMdata.slice(0)
            } else {
                that.pdata = DMdata
            }
        }
        that.riOffset = rowIndxOffset >= 0 ? rowIndxOffset : 0;
        that._trigger("dataReady", null, {
            source: obj.source
        });
        that._trigger("dataReadyAfter", null, {
            source: obj.source
        })
    };
    fn.getQueryStringCRUD = function() {
        return ""
    };
    fn.remoteRequest = function(objP) {
        if (this.loading) {
            this.xhr.abort()
        }
        objP = objP || {};
        var that = this,
            url = "",
            dataURL = "",
            o = this.options,
            raiseFilterEvent = false,
            thisColModel = this.colModel,
            DM = o.dataModel,
            SM = o.sortModel,
            FM = o.filterModel,
            PM = o.pageModel;
        if (typeof DM.getUrl === "function") {
            var objk = {
                colModel: thisColModel,
                dataModel: DM,
                sortModel: SM,
                groupModel: o.groupModel,
                pageModel: PM,
                filterModel: FM
            };
            var objURL = DM.getUrl.call(this, objk);
            if (objURL && objURL.url) {
                url = objURL.url
            }
            if (objURL && objURL.data) {
                dataURL = objURL.data
            }
        } else if (typeof DM.url === "string") {
            url = DM.url;
            var sortQueryString = {},
                filterQueryString = {},
                pageQueryString = {};
            if (SM.type === "remote") {
                if (!objP.initBySort) {
                    this.sort({
                        initByRemote: true
                    })
                }
                var sortingQS = this.iSort.getQueryStringSort();
                if (sortingQS) {
                    sortQueryString = {
                        pq_sort: sortingQS
                    }
                }
            }
            if (PM.type === "remote") {
                pageQueryString = {
                    pq_curpage: PM.curPage,
                    pq_rpp: PM.rPP
                }
            }
            var filterQS;
            if (FM.type !== "local") {
                filterQS = this.iFilterData.getQueryStringFilter();
                if (filterQS) {
                    raiseFilterEvent = true;
                    filterQueryString = {
                        pq_filter: filterQS
                    }
                }
            }
            var postData = DM.postData,
                postDataOnce = DM.postDataOnce;
            if (postData && typeof postData === "function") {
                postData = postData.call(this, {
                    colModel: thisColModel,
                    dataModel: DM
                })
            }
            dataURL = $.extend({
                pq_datatype: DM.dataType
            }, filterQueryString, pageQueryString, sortQueryString, postData, postDataOnce)
        }
        if (!url) {
            return
        }
        this.loading = true;
        this.showLoading();
        this.xhr = $.ajax({
            url: url,
            dataType: DM.dataType,
            async: DM.async === null ? true : DM.async,
            cache: DM.cache,
            contentType: DM.contentType,
            type: DM.method,
            data: dataURL,
            beforeSend: function(jqXHR, settings) {
                if (typeof DM.beforeSend === "function") {
                    return DM.beforeSend.call(that, jqXHR, settings)
                }
            },
            success: function(responseObj, textStatus, jqXHR) {
                that.onRemoteSuccess(responseObj, textStatus, jqXHR, raiseFilterEvent, objP)
            },
            error: function(jqXHR, textStatus, errorThrown) {
                that.hideLoading();
                that.loading = false;
                if (typeof DM.error === "function") {
                    DM.error.call(that, jqXHR, textStatus, errorThrown)
                } else if (errorThrown !== "abort") {
                    throw "Error : " + errorThrown
                }
            }
        })
    };
    fn.onRemoteSuccess = function(response, textStatus, jqXHR, raiseFilterEvent, objP) {
        var that = this,
            o = that.options,
            retObj, CM = that.colModel,
            PM = o.pageModel,
            DM = o.dataModel;
        if (typeof DM.getData === "function") {
            retObj = DM.getData.call(that, response, textStatus, jqXHR)
        } else {
            retObj = response
        }
        DM.data = retObj.data;
        if (PM.type === "remote") {
            if (retObj.curPage !== null) PM.curPage = retObj.curPage;
            if (retObj.totalRecords !== null) {
                PM.totalRecords = retObj.totalRecords
            }
        }
        that.hideLoading();
        that.loading = false;
        that._trigger("load", null, {
            dataModel: DM,
            colModel: CM
        });
        if (raiseFilterEvent) {
            that._queueATriggers["filter"] = {
                ui: {}
            }
        }
        if (objP.callback) {
            objP.callback()
        }
    };
    fn._refreshTitle = function() {
        this.$title.html(this.options.title)
    };
    fn._destroyDraggable = function() {
        var ele = this.element;
        var $parent = ele.parent(".pq-wrapper");
        if ($parent.length && $parent.data("draggable")) {
            $parent.draggable("destroy");
            this.$title.removeClass("pq-draggable pq-no-capture");
            ele.unwrap(".pq-wrapper")
        }
    };
    fn._refreshDraggable = function() {
        var o = this.options,
            ele = this.element,
            $title = this.$title;
        if (o.draggable) {
            $title.addClass("pq-draggable pq-no-capture");
            var $wrap = ele.parent(".pq-wrapper");
            if (!$wrap.length) {
                ele.wrap("<div class='pq-wrapper' />")
            }
            ele.parent(".pq-wrapper").draggable({
                handle: $title
            })
        } else {
            this._destroyDraggable()
        }
    };
    fn._refreshResizable = function() {
        var that = this,
            $ele = this.element,
            o = this.options,
            widthPercent = (o.width + "").indexOf("%") > -1,
            heightPercent = (o.height + "").indexOf("%") > -1,
            autoWidth = o.width === "auto",
            flexWidth = o.width === "flex",
            flexHeight = o.height === "flex";
        if (o.resizable && (!(flexHeight || heightPercent) || !(flexWidth || widthPercent || autoWidth))) {
            var handles = "e,s,se";
            if (flexHeight || heightPercent) {
                handles = "e"
            } else if (flexWidth || widthPercent || autoWidth) {
                handles = "s"
            }
            var initReq = true;
            if ($ele.hasClass("ui-resizable")) {
                var handles2 = $ele.resizable("option", "handles");
                if (handles === handles2) {
                    initReq = false
                } else {
                    this._destroyResizable()
                }
            }
            if (initReq) {
                $ele.resizable({
                    helper: "ui-state-default",
                    handles: handles,
                    minWidth: o.minWidth,
                    minHeight: o.minHeight ? o.minHeight : 100,
                    delay: 0,
                    start: function(evt, ui) {
                        $(ui.helper).css({
                            opacity: .5,
                            background: "#ccc",
                            border: "1px solid steelblue"
                        })
                    },
                    resize: function(evt, ui) {},
                    stop: function(evt, ui) {
                        var $ele = that.element,
                            ele = $ele[0],
                            width = o.width,
                            height = o.height,
                            widthPercent = (width + "").indexOf("%") > -1,
                            heightPercent = (height + "").indexOf("%") > -1,
                            autoWidth = width === "auto",
                            flexWidth = width === "flex",
                            flexHeight = height === "flex",
                            refreshRQ = false;
                        ele.style.width = ele.offsetWidth + 3 + "px";
                        ele.style.height = ele.offsetHeight + 3 + "px";
                        if (!heightPercent && !flexHeight) {
                            refreshRQ = true;
                            o.height = ele.offsetHeight
                        }
                        if (!widthPercent && !autoWidth && !flexWidth) {
                            refreshRQ = true;
                            o.width = ele.offsetWidth
                        }
                        that.refresh({
                            soft: true
                        });
                        $ele.css("position", "relative");
                        if (refreshRQ) {
                            $(window).trigger("resize")
                        }
                    }
                })
            }
        } else {
            this._destroyResizable()
        }
    };
    fn.refresh = function(objP) {
        this.iRefresh.refresh(objP)
    };
    fn.refreshView = function(obj) {
        if (this.options.editModel.indices !== null) {
            this.blurEditor({
                force: true
            })
        }
        this.refreshDataFromDataModel(obj);
        this.refresh(obj)
    };
    fn._refreshPager = function() {
        var options = this.options,
            PM = options.pageModel,
            paging = PM.type ? true : false,
            rPP = PM.rPP,
            totalRecords = PM.totalRecords;
        if (paging) {
            var obj = options.pageModel;
            if (!this.pagerW) {
                this._initPager()
            }
            this.pagerW.option(obj);
            if (totalRecords > rPP) {
                this.$bottom.css("display", "")
            } else if (!options.showBottom) {
                this.$bottom.css("display", "none")
            }
        } else {
            if (this.pagerW) {
                this.pagerW.destroy()
            }
            if (options.showBottom) {
                this.$bottom.css("display", "")
            } else {
                this.$bottom.css("display", "none")
            }
        }
    };
    fn.getInstance = function() {
        return {
            grid: this
        }
    };
    fn.refreshDataAndView = function(objP) {
        var DM = this.options.dataModel;
        this.pdata = [];
        if (DM.location === "remote") {
            var self = this;
            this.remoteRequest({
                callback: function() {
                    self._onDataAvailable(objP)
                }
            })
        } else {
            this._onDataAvailable(objP)
        }
    };
    fn.getColIndx = function(ui) {
        var dataIndx = ui.dataIndx,
            column = ui.column,
            colIndx, searchByColumn, searchByDI;
        if (column) {
            searchByColumn = true
        } else if (dataIndx !== undefined) {
            searchByDI = true
        } else {
            throw "dataIndx / column NA"
        }
        var CM = this.colModel,
            len = CM.length;
        if (searchByColumn) {
            for (var i = 0; i < len; i++) {
                if (CM[i] === column) {
                    return i
                }
            }
        } else {
            colIndx = this.colIndxs[dataIndx];
            if (colIndx !== null) {
                return colIndx
            }
        }
        return -1
    };
    fn.getColumn = function(obj) {
        var di = obj.dataIndx;
        if (di === null) {
            throw "dataIndx N/A"
        }
        return this.columns[di] || this.iGroup.getColsPrimary()[di]
    };
    fn._generateCellRowOutline = function() {
        var o = this.options,
            EM = o.editModel;
        if (this.$div_focus) {
            return
        } else {
            var $parent = this.element;
            if (EM.inline) {
                $parent = this.getCell(EM.indices);
                $parent.css("padding", 0).empty()
            }
            this.$div_focus = $(["<div class='pq-editor-outer'>", "<div class='pq-editor-inner'>", "</div>", "</div>"].join("")).appendTo($parent)
        }
        var obj = $.extend({
            all: true
        }, EM.indices);
        var $td = this.getCell(obj);
        $td.css("height", $td[0].offsetHeight);
        $td.empty();
        this.refreshEditorPos()
    };
    fn.refreshEditorPos = function() {};
    fn._removeEditOutline = function(objP) {
        function destroyDatePicker($editor) {
            if ($editor.hasClass("hasDatepicker")) {
                $editor.datepicker("hide").datepicker("destroy")
            }
        }
        if (this.$div_focus) {
            var $editor = this.$div_focus.find(".pq-editor-focus");
            destroyDatePicker($editor);
            if ($editor[0] === document.activeElement) {
                var prevBlurEditMode = this._blurEditMode;
                this._blurEditMode = true;
                $editor.blur();
                this._blurEditMode = prevBlurEditMode
            }
            this.$div_focus.remove();
            delete this.$div_focus;
            var EM = this.options.editModel;
            var obj = $.extend({}, EM.indices);
            EM.indices = null;
            obj.rowData = undefined;
            this.refreshCell(obj)
        }
    };
    fn.scrollX = function(x, fn) {
        var self = this;
        return self.iRenderB.scrollX(x, function() {
            fn && fn.call(self)
        })
    };
    fn.scrollY = function(y, fn) {
        var self = this;
        return self.iRenderB.scrollY(y, function() {
            fn && fn.call(self)
        })
    };
    fn.scrollXY = function(x, y, fn) {
        var self = this;
        return self.iRenderB.scrollXY(x, y, function() {
            fn && fn.call(self)
        })
    };
    fn.scrollRow = function(obj, fn) {
        var self = this;
        self.iRenderB.scrollRow(self.normalize(obj).rowIndxPage, function() {
            fn && fn.call(self)
        })
    };
    fn.scrollColumn = function(obj, fn) {
        var self = this;
        self.iRenderB.scrollColumn(self.normalize(obj).colIndx, function() {
            fn && fn.call(self)
        })
    };
    fn.scrollCell = function(obj, fn) {
        var self = this,
            ui = self.normalize(obj);
        self.iRenderB.scrollCell(ui.rowIndxPage, ui.colIndx, function() {
            fn && fn.call(self);
            self._trigger("scrollCell")
        })
    };
    fn.blurEditor = function(objP) {
        if (this.$div_focus) {
            var $editor = this.$div_focus.find(".pq-editor-focus");
            if (objP && objP.blurIfFocus) {
                if (document.activeElement === $editor[0]) {
                    $editor.blur()
                }
            } else {
                return $editor.triggerHandler("blur", objP)
            }
        }
    };
    fn.Selection = function() {
        return this.iSelection
    };
    fn.goToPage = function(obj) {
        var DM = this.options.pageModel;
        if (DM.type === "local" || DM.type === "remote") {
            var rowIndx = obj.rowIndx,
                rPP = DM.rPP,
                page = obj.page === null ? Math.ceil((rowIndx + 1) / rPP) : obj.page,
                curPage = DM.curPage;
            if (page !== curPage) {
                DM.curPage = page;
                if (DM.type === "local") {
                    this.refreshView()
                } else {
                    this.refreshDataAndView()
                }
            }
        }
    };
    fn.setSelection = function(obj, fn) {
        if (obj === null) {
            this.iSelection.removeAll();
            this.iRows.removeAll({
                all: true
            });
            return true
        }
        var self = this,
            data = self.pdata,
            cb = function() {
                if (rowIndxPage !== null && obj.focus !== false) {
                    self.focus({
                        rowIndxPage: rowIndxPage,
                        colIndx: colIndx === null ? self.getFirstVisibleCI() : colIndx
                    })
                }
                fn && fn.call(self)
            };
        if (!data || !data.length) {
            cb()
        }
        obj = this.normalize(obj);
        var rowIndx = obj.rowIndx,
            rowIndxPage = obj.rowIndxPage,
            colIndx = obj.colIndx;
        if (rowIndx === null || rowIndx < 0 || colIndx < 0 || colIndx >= this.colModel.length) {
            cb()
        }
        this.goToPage(obj);
        rowIndxPage = rowIndx - this.riOffset;
        self.scrollRow({
            rowIndxPage: rowIndxPage
        }, function() {
            if (colIndx === null) {
                self.iRows.add({
                    rowIndx: rowIndx
                });
                cb()
            } else {
                self.scrollColumn({
                    colIndx: colIndx
                }, function() {
                    self.Range({
                        r1: rowIndx,
                        c1: colIndx
                    }).select();
                    cb()
                })
            }
        })
    };
    fn.getColModel = function() {
        return this.colModel
    };
    fn.getCMPrimary = function() {
        return this.iGroup.getCMPrimary()
    };
    fn.getOCMPrimary = function() {
        return this.iGroup.getOCMPrimary()
    };
    fn.saveEditCell = function(objP) {
        var o = this.options;
        var EM = o.editModel;
        if (!EM.indices) {
            return null
        }
        var obj = $.extend({}, EM.indices),
            evt = objP ? objP.evt : null,
            offset = this.riOffset,
            colIndx = obj.colIndx,
            rowIndxPage = obj.rowIndxPage,
            rowIndx = rowIndxPage + offset,
            thisColModel = this.colModel,
            column = thisColModel[colIndx],
            dataIndx = column.dataIndx,
            pdata = this.pdata,
            rowData = pdata[rowIndxPage],
            DM = o.dataModel,
            oldVal;
        if (rowData === null) {
            return null
        }
        if (rowIndxPage !== null) {
            var newVal = this.getEditCellData();
            if ($.isPlainObject(newVal)) {
                oldVal = {};
                for (var key in newVal) {
                    oldVal[key] = rowData[key]
                }
            } else {
                oldVal = this.readCell(rowData, column)
            }
            if (newVal === "<br>") {
                newVal = ""
            }
            if (oldVal === null && newVal === "") {
                newVal = null
            }
            var objCell = {
                rowIndx: rowIndx,
                rowIndxPage: rowIndxPage,
                dataIndx: dataIndx,
                column: column,
                newVal: newVal,
                value: newVal,
                oldVal: oldVal,
                rowData: rowData,
                dataModel: DM
            };
            if (this._trigger("cellBeforeSave", evt, objCell) === false) {
                return false
            }
            if (1 === 1) {
                var newRow = {};
                if ($.isPlainObject(newVal)) {
                    newRow = newVal
                } else {
                    newRow[dataIndx] = newVal
                }
                var ret = this.updateRow({
                    row: newRow,
                    rowIndx: rowIndx,
                    silent: true,
                    source: "edit",
                    checkEditable: false
                });
                if (ret === false) {
                    return false
                }
                this._trigger("cellSave", evt, objCell)
            }
            return true
        }
    };
    fn._addInvalid = function(ui) {};
    fn._digestNewRow = function(newRow, oldRow, rowIndx, rowData, type, rowCheckEditable, validate, allowInvalid, source) {
        var that = this,
            getValueFromDataType = that.getValueFromDataType,
            dataIndx, columns = that.columns,
            colIndxs = that.colIndxs,
            column, colIndx;
        for (dataIndx in newRow) {
            column = columns[dataIndx];
            colIndx = colIndxs[dataIndx];
            if (column) {
                if (rowCheckEditable && that.isEditable({
                        rowIndx: rowIndx,
                        rowData: rowData,
                        colIndx: colIndx,
                        column: column
                    }) === false) {
                    delete newRow[dataIndx];
                    oldRow && delete oldRow[dataIndx];
                    continue
                }
                var dataType = column.dataType,
                    newVal = getValueFromDataType(newRow[dataIndx], dataType),
                    oldVal = oldRow ? oldRow[dataIndx] : undefined,
                    oldVal = oldVal !== undefined ? getValueFromDataType(oldVal, dataType) : undefined;
                newRow[dataIndx] = newVal;
                if (validate && column.validations) {
                    if (source === "edit" && allowInvalid === false) {
                        var objRet = this.isValid({
                            focusInvalid: true,
                            dataIndx: dataIndx,
                            rowIndx: rowIndx,
                            value: newVal
                        });
                        if (objRet.valid === false && !objRet.warn) {
                            return false
                        }
                    } else {
                        var wRow = type === "add" ? newRow : rowData,
                            objRet = this.iValid.isValidCell({
                                column: column,
                                rowData: wRow,
                                allowInvalid: allowInvalid,
                                value: newVal
                            });
                        if (objRet.valid === false) {
                            if (allowInvalid === false && !objRet.warn) {
                                delete newRow[dataIndx]
                            }
                        }
                    }
                }
                if (type === "update" && newVal === oldVal) {
                    delete newRow[dataIndx];
                    delete oldRow[dataIndx];
                    continue
                }
            }
        }
        if (type === "update") {
            if (!pq.isEmpty(newRow)) {
                return true
            }
        } else {
            return true
        }
    };
    fn._digestData = function(ui) {
        if (ui.rowList) {
            throw "not supported"
        } else {
            addList = ui.addList = ui.addList || [], ui.updateList = ui.updateList || [], ui.deleteList = ui.deleteList || [];
            if (addList.length && addList[0].rowData) {
                throw "rd in addList"
            }
        }
        if (this._trigger("beforeValidate", null, ui) === false) {
            return false
        }
        var that = this,
            options = that.options,
            EM = options.editModel,
            DM = options.dataModel,
            data = DM.data,
            CM = options.colModel,
            PM = options.pageModel,
            HM = options.historyModel,
            dis = CM.map(function(col) {
                return col.dataIndx
            }),
            validate = ui.validate === null ? EM.validate : ui.validate,
            remotePaging = PM.type === "remote",
            allowInvalid = ui.allowInvalid === null ? EM.allowInvalid : ui.allowInvalid,
            TM = options.trackModel,
            track = ui.track,
            track = track === null ? options.track === null ? TM.on : options.track : track,
            history = ui.history === null ? HM.on : ui.history,
            iHistory = this.iHistory,
            iUCData = this.iUCData,
            checkEditable = ui.checkEditable === null ? true : ui.checkEditable,
            checkEditableAdd = ui.checkEditableAdd === null ? checkEditable : ui.checkEditableAdd,
            source = ui.source,
            iRefresh = that.iRefresh,
            offset = this.riOffset,
            addList = ui.addList,
            updateList = ui.updateList,
            deleteList = ui.deleteList,
            addListLen, deleteListLen, i, len, addListNew = [],
            updateListNew = [];
        !data && (data = DM.data = []);
        for (i = 0, len = updateList.length; i < len; i++) {
            var rowListObj = updateList[i],
                newRow = rowListObj.newRow,
                rowData = rowListObj.rowData,
                rowCheckEditable = rowListObj.checkEditable,
                rowIndx = rowListObj.rowIndx,
                oldRow = rowListObj.oldRow,
                ret;
            rowCheckEditable === null && (rowCheckEditable = checkEditable);
            if (!oldRow) {
                throw "oldRow required while update"
            }
            ret = this._digestNewRow(newRow, oldRow, rowIndx, rowData, "update", rowCheckEditable, validate, allowInvalid, source);
            if (ret === false) {
                return false
            }
            ret && updateListNew.push(rowListObj)
        }
        for (i = 0, len = addList.length; i < len; i++) {
            var rowListObj = addList[i],
                newRow = rowListObj.newRow,
                rowData, rowCheckEditable = rowListObj.checkEditable,
                rowIndx = rowListObj.rowIndx,
                oldRow;
            rowCheckEditable === null && (rowCheckEditable = checkEditableAdd);
            dis.forEach(function(di) {
                newRow[di] = newRow[di]
            });
            ret = this._digestNewRow(newRow, oldRow, rowIndx, rowData, "add", rowCheckEditable, validate, allowInvalid, source);
            if (ret === false) {
                return false
            }
            ret && addListNew.push(rowListObj)
        }
        addList = ui.addList = addListNew;
        updateList = ui.updateList = updateListNew;
        addListLen = addList.length;
        deleteListLen = deleteList.length;
        if (!addListLen && !updateList.length && !deleteListLen) {
            if (source === "edit") {
                return null
            }
            return false
        }
        if (history) {
            iHistory.increment();
            iHistory.push(ui)
        }
        that._digestUpdate(updateList, iUCData, track);
        if (deleteListLen) {
            that._digestDelete(deleteList, iUCData, track, data, PM, remotePaging, offset);
            iRefresh.addRowIndx()
        }
        if (addListLen) {
            that._digestAdd(addList, iUCData, track, data, PM, remotePaging, offset);
            iRefresh.addRowIndx()
        }
        that._trigger("change", null, ui);
        return true
    };
    fn._digestUpdate = function(rowList, iUCData, track) {
        var i = 0,
            len = rowList.length,
            column, newVal, dataIndx, columns = this.columns,
            saveCell = this.saveCell;
        for (; i < len; i++) {
            var rowListObj = rowList[i],
                newRow = rowListObj.newRow,
                rowData = rowListObj.rowData;
            if (track) {
                iUCData.update({
                    rowData: rowData,
                    row: newRow,
                    refresh: false
                })
            }
            for (dataIndx in newRow) {
                column = columns[dataIndx];
                newVal = newRow[dataIndx];
                saveCell(rowData, column, newVal)
            }
        }
    };
    fn._digestAdd = function(rowList, iUCData, track, data, PM, remotePaging, offset) {
        var i = 0,
            len = rowList.length,
            indx, rowIndxPage;
        rowList.sort(function(a, b) {
            return a.rowIndx - b.rowIndx
        });
        for (; i < len; i++) {
            var rowListObj = rowList[i],
                newRow = rowListObj.newRow,
                rowIndx = rowListObj.rowIndx;
            if (track) {
                iUCData.add({
                    rowData: newRow
                })
            }
            if (rowIndx === null) {
                data.push(newRow)
            } else {
                rowIndxPage = rowIndx - offset;
                indx = remotePaging ? rowIndxPage : rowIndx;
                data.splice(indx, 0, newRow)
            }
            rowListObj.rowData = newRow;
            if (remotePaging) {
                PM.totalRecords++
            }
        }
    };
    fn._digestDelete = function(rowList, iUCData, track, data, PM, remotePaging, offset) {
        var i = 0,
            len = rowList.length;
        for (; i < len; i++) {
            var rowListObj = rowList[i],
                rowData = rowListObj.rowData,
                rowIndxObj = this.getRowIndx({
                    rowData: rowData,
                    dataUF: true
                }),
                uf = rowIndxObj.uf,
                rowIndx = rowIndxObj.rowIndx;
            rowListObj.uf = uf;
            rowListObj.rowIndx = rowIndx
        }
        rowList.sort(function(a, b) {
            return b.rowIndx - a.rowIndx
        });
        for (i = 0; i < len; i++) {
            var rowListObj = rowList[i],
                rowData = rowListObj.rowData,
                uf = rowListObj.uf,
                rowIndx = rowListObj.rowIndx;
            if (track) {
                iUCData["delete"]({
                    rowIndx: rowIndx,
                    rowData: rowData
                })
            }
            var rowIndxPage = rowIndx - offset,
                indx = remotePaging ? rowIndxPage : rowIndx;
            if (uf) {
                DM.dataUF.splice(rowIndx, 1)
            } else {
                var remArr = data.splice(indx, 1);
                if (remArr && remArr.length && remotePaging) {
                    PM.totalRecords--
                }
            }
        }
    };
    fn.refreshColumn = function(ui) {
        var self = this,
            obj = self.normalize(ui),
            iR = self.iRenderB;
        obj.skip = true;
        iR.eachV(function(rd, rip) {
            obj.rowIndxPage = rip;
            self.refreshCell(obj)
        });
        self._trigger("refreshColumn", null, obj)
    };
    fn.refreshCell = function(ui) {
        var obj = this.normalize(ui),
            _fe = this._focusEle,
            rip = obj.rowIndxPage,
            ci = obj.colIndx;
        if (this.iRenderB.refreshCell(rip, ci, obj.rowData, obj.column)) {
            if (_fe && _fe.rowIndxPage === rip) {
                this.focus()
            }
            if (!obj.skip) {
                this._trigger("refreshCell", null, obj)
            }
        }
    };
    fn.refreshHeaderCell = function(ui) {
        var obj = this.normalize(ui),
            hc = this.headerCells,
            rip = hc.length - 1,
            rd = hc[rip];
        this.iRenderHead.refreshCell(rip, obj.colIndx, rd, obj.column)
    };
    fn.refreshRow = function(_obj) {
        if (!this.pdata) return;
        var that = this,
            obj = that.normalize(_obj),
            ri = obj.rowIndx,
            rip = obj.rowIndxPage,
            _fe, rowData = obj.rowData;
        if (!rowData) {
            return null
        }
        that.iRenderB.refreshRow(rip);
        that.refresh({
            soft: true
        });
        if ((_fe = that._focusEle) && _fe.rowIndxPage === rip) {
            that.focus()
        }
        that._trigger("refreshRow", null, {
            rowData: rowData,
            rowIndx: ri,
            rowIndxPage: rip
        });
        return true
    };
    fn.quitEditMode = function(objP) {
        if (this._quitEditMode) {
            return
        }
        var that = this,
            old = false,
            silent = false,
            fireOnly = false,
            o = this.options,
            EM = o.editModel,
            EMIndices = EM.indices,
            evt = undefined;
        that._quitEditMode = true;
        if (objP) {
            old = objP.old;
            silent = objP.silent;
            fireOnly = objP.fireOnly;
            evt = objP.evt
        }
        if (EMIndices) {
            if (!silent && !old) {
                this._trigger("editorEnd", evt, EMIndices)
            }
            if (!fireOnly) {
                this._removeEditOutline(objP);
                EM.indices = null
            }
        }
        that._quitEditMode = null
    };
    fn.getViewPortRowsIndx = function() {
        return {
            beginIndx: this.initV,
            endIndx: this.finalV
        }
    };
    fn.getViewPortIndx = function() {
        var iR = this.iRenderB;
        return {
            initV: iR.initV,
            finalV: iR.finalV,
            initH: iR.initH,
            finalH: iR.finalH
        }
    };
    fn.getRIOffset = function() {
        return this.riOffset
    };
    fn.getEditCell = function() {
        var EM = this.options.editModel;
        if (EM.indices) {
            var $td = this.getCell(EM.indices),
                $cell = this.$div_focus.children(".pq-editor-inner"),
                $editor = $cell.find(".pq-editor-focus");
            return {
                $td: $td,
                $cell: $cell,
                $editor: $editor
            }
        } else {
            return {}
        }
    };
    fn.editCell = function(ui) {
        var self = this,
            obj = self.normalize(ui),
            iM = self.iMerge,
            m, $td, ri = obj.rowIndx,
            ci = obj.colIndx;
        if (iM.ismergedCell(ri, ci)) {
            m = iM.getRootCellO(ri, ci);
            if (m.rowIndx !== obj.rowIndx || m.colIndx !== obj.colIndx) {
                return false
            }
        }
        self.scrollCell(obj, function() {
            $td = self.getCell(obj);
            if ($td && $td.length) {
                return self._editCell(obj)
            }
        })
    };
    fn.getFirstEditableColIndx = function(objP) {
        if (objP.rowIndx === null) {
            throw "rowIndx NA"
        }
        var CM = this.colModel,
            i = 0;
        for (; i < CM.length; i++) {
            if (CM[i].hidden) {
                continue
            }
            objP.colIndx = i;
            if (!this.isEditable(objP)) {
                continue
            }
            return i
        }
        return -1
    };
    fn.editFirstCellInRow = function(objP) {
        var obj = this.normalize(objP),
            ri = obj.rowIndx,
            colIndx = this.getFirstEditableColIndx({
                rowIndx: ri
            });
        if (colIndx !== -1) {
            this.editCell({
                rowIndx: ri,
                colIndx: colIndx
            })
        }
    };
    fn._editCell = function(_objP) {
        var objP = this.normalize(_objP);
        var that = this,
            evt = objP.evt,
            rip = objP.rowIndxPage,
            ci = objP.colIndx,
            pdata = that.pdata;
        if (!pdata || rip >= pdata.length) {
            return false
        }
        var that = this,
            o = this.options,
            EM = o.editModel,
            rowData = pdata[rip],
            rowIndx = objP.rowIndx,
            CM = this.colModel,
            column = CM[ci],
            dataIndx = column.dataIndx,
            cellData = that.readCell(rowData, column),
            objCall = {
                rowIndx: rowIndx,
                rowIndxPage: rip,
                cellData: cellData,
                rowData: rowData,
                dataIndx: dataIndx,
                colIndx: ci,
                column: column
            },
            ceditor = column.editor,
            grid = this,
            type_editor = typeof ceditor,
            ceditor = type_editor === "function" || type_editor === "string" ? grid.callFn(ceditor, objCall) : ceditor;
        if (ceditor === undefined && typeof o.geditor === "function") {
            ceditor = o.geditor.call(grid, objCall)
        }
        if (ceditor === false) {
            return
        }
        if (ceditor && ceditor.getData) {
            EM._getData = ceditor.getData
        }
        var geditor = o.editor,
            editor = ceditor ? $.extend({}, geditor, ceditor) : geditor,
            contentEditable = false;
        if (EM.indices) {
            var indxOld = EM.indices;
            if (indxOld.rowIndxPage === rip && indxOld.colIndx === ci) {
                this.refreshEditorPos();
                var $focus = this.$div_focus.find(".pq-editor-focus");
                $focus[0].focus();
                if (document.activeElement !== $focus[0]) {
                    window.setTimeout(function() {
                        $focus.focus()
                    }, 0)
                }
                return false
            } else {
                if (this.blurEditor({
                        evt: evt
                    }) === false) {
                    return false
                }
                this.quitEditMode({
                    evt: evt
                })
            }
        }
        EM.indices = {
            rowIndxPage: rip,
            rowIndx: rowIndx,
            colIndx: ci,
            column: column,
            dataIndx: dataIndx
        };
        this._generateCellRowOutline();
        var $div_focus = this.$div_focus,
            $cell = $div_focus.children(".pq-editor-inner");
        $cell.addClass("pq-align-" + (column.align || "left"));
        objCall.$cell = $cell;
        var inp, edtype = editor.type,
            edSelect = objP.select === null ? editor.select : objP.select,
            edInit = editor.init,
            ed_valueIndx = editor.valueIndx,
            ed_dataMap = editor.dataMap,
            ed_mapIndices = editor.mapIndices,
            ed_mapIndices = ed_mapIndices ? ed_mapIndices : {},
            edcls = editor.cls || "",
            edcls = typeof edcls === "function" ? edcls.call(grid, objCall) : edcls,
            cls = "pq-editor-focus " + edcls,
            cls2 = cls + " pq-cell-editor ",
            attr = editor.attr || "",
            attr = typeof attr === "function" ? attr.call(grid, objCall) : attr,
            edstyle = editor.style || "",
            edstyle = typeof edstyle === "function" ? edstyle.call(grid, objCall) : edstyle,
            styleCE = edstyle ? "style='" + edstyle + "'" : "",
            style = styleCE,
            styleChk = styleCE;
        objCall.cls = cls;
        objCall.attr = attr;
        if (typeof edtype === "function") {
            inp = edtype.call(grid, objCall);
            if (inp) {
                edtype = inp
            }
        }
        geditor._type = edtype;
        if (edtype === "checkbox") {
            var subtype = editor.subtype;
            var checked = cellData ? "checked='checked'" : "";
            inp = "<input " + checked + " class='" + cls2 + "' " + attr + " " + styleChk + " type=checkbox name='" + dataIndx + "' />";
            $cell.html(inp);
            var $ele = $cell.children("input");
            if (subtype === "triple") {
                $ele.pqval({
                    val: cellData
                });
                $cell.click(function(evt) {
                    $(this).children("input").pqval({
                        incr: true
                    })
                })
            }
        } else if (edtype === "textarea" || edtype === "select" || edtype === "textbox") {
            if (edtype === "textarea") {
                inp = "<textarea class='" + cls2 + "' " + attr + " " + style + " name='" + dataIndx + "' ></textarea>"
            } else if (edtype === "select") {
                var options = editor.options || [];
                if (options.constructor !== Array) {
                    options = that.callFn(options, objCall)
                }
                var attrSelect = [attr, " class='", cls2, "' ", style, " name='", dataIndx, "'"].join("");
                inp = _pq.select({
                    options: options,
                    attr: attrSelect,
                    prepend: editor.prepend,
                    labelIndx: editor.labelIndx,
                    valueIndx: ed_valueIndx,
                    groupIndx: editor.groupIndx,
                    dataMap: ed_dataMap
                })
            } else {
                inp = "<input class='" + cls2 + "' " + attr + " " + style + " type=text name='" + dataIndx + "' />"
            }
            $(inp).appendTo($cell).val(edtype === "select" && ed_valueIndx !== null && (ed_mapIndices[ed_valueIndx] || this.columns[ed_valueIndx]) ? ed_mapIndices[ed_valueIndx] ? rowData[ed_mapIndices[ed_valueIndx]] : rowData[ed_valueIndx] : cellData)
        } else if (!edtype || edtype === "contenteditable") {
            inp = "<div contenteditable='true' tabindx='0' " + styleCE + " " + attr + " class='" + cls2 + "'></div>";
            $cell.html(inp);
            $cell.children().html(cellData);
            contentEditable = true
        }
        if (edInit) {
            objCall.$editor = $cell.children(".pq-editor-focus");
            this.callFn(edInit, objCall)
        }
        var $focus = $cell.children(".pq-editor-focus"),
            FK = EM.filterKeys,
            cEM = column.editModel;
        if (cEM && cEM.filterKeys !== undefined) {
            FK = cEM.filterKeys
        }
        var objTrigger = {
            $cell: $cell,
            $editor: $focus,
            $td: that.getCell(EM.indices),
            dataIndx: dataIndx,
            column: column,
            colIndx: ci,
            rowIndx: rowIndx,
            rowIndxPage: rip,
            rowData: rowData
        };
        EM.indices = objTrigger;
        $focus.data({
            FK: FK
        }).on("click", function(evt) {
            $(this).focus();
            that._trigger("editorClick", null, objTrigger)
        }).on("keydown", function(evt) {
            that.iKeyNav.keyDownInEdit(evt)
        }).on("keypress", function(evt) {
            return that.iKeyNav.keyPressInEdit(evt, {
                FK: FK
            })
        }).on("keyup", function(evt) {
            return that.iKeyNav.keyUpInEdit(evt, {
                FK: FK
            })
        }).on("blur", function(evt, objP) {
            var o = that.options,
                EM = o.editModel,
                onBlur = EM.onBlur,
                saveOnBlur = onBlur === "save",
                validateOnBlur = onBlur === "validate",
                cancelBlurCls = EM.cancelBlurCls,
                force = objP ? objP.force : false;
            if (that._quitEditMode || that._blurEditMode) {
                return
            }
            if (!EM.indices) {
                return
            }
            var $this = $(evt.target);
            if (!force) {
                if (that._trigger("editorBlur", evt, objTrigger) === false) {
                    return
                }
                if (!onBlur) {
                    return
                }
                if (cancelBlurCls && $this.hasClass(cancelBlurCls)) {
                    return
                }
                if ($this.hasClass("hasDatepicker")) {
                    var $datepicker = $this.datepicker("widget");
                    if ($datepicker.is(":visible")) {
                        return false
                    }
                } else if ($this.hasClass("ui-autocomplete-input")) {
                    if ($this.autocomplete("widget").is(":visible")) {
                        return
                    }
                } else if ($this.hasClass("ui-multiselect")) {
                    if ($(".ui-multiselect-menu").is(":visible") || $(document.activeElement).closest(".ui-multiselect-menu").length) {
                        return
                    }
                } else if ($this.hasClass("pq-select-button")) {
                    if ($(".pq-select-menu").is(":visible") || $(document.activeElement).closest(".pq-select-menu").length) {
                        return
                    }
                }
            }
            that._blurEditMode = true;
            var silent = force || saveOnBlur || !validateOnBlur;
            if (!that.saveEditCell({
                    evt: evt,
                    silent: silent
                })) {
                if (!force && validateOnBlur) {
                    that._deleteBlurEditMode();
                    return false
                }
            }
            that.quitEditMode({
                evt: evt
            });
            that._deleteBlurEditMode()
        }).on("focus", function(evt) {
            that._trigger("editorFocus", evt, objTrigger)
        });
        that._trigger("editorBegin", evt, objTrigger);
        $focus.focus();
        window.setTimeout(function() {
            var $ae = $(document.activeElement);
            if ($ae.hasClass("pq-editor-focus") === false) {
                var $focus = that.element ? that.element.find(".pq-editor-focus") : $();
                $focus.focus()
            }
        });
        if (edSelect) {
            if (contentEditable) {
                try {
                    var el = $focus[0];
                    var range = document.createRange();
                    range.selectNodeContents(el);
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range)
                } catch (ex) {}
            } else {
                $focus.select()
            }
        }
    };
    fn._deleteBlurEditMode = function(objP) {
        var that = this,
            objP = objP ? objP : {};
        if (that._blurEditMode) {
            if (objP.timer) {
                window.setTimeout(function() {
                    delete that._blurEditMode
                }, 0)
            } else {
                delete that._blurEditMode
            }
        }
    };
    fn.getRow = function(_obj) {
        var obj = this.normalize(_obj),
            rip = obj.rowIndxPage;
        return this.iRenderB.get$Row(rip)
    };
    fn.getCell = function(ui) {
        if (ui.vci >= 0) ui.colIndx = this.iCols.getci(ui.vci);
        var obj = this.normalize(ui),
            rip = obj.rowIndxPage,
            ci = obj.colIndx,
            td = this.iRenderB.getCell(rip, ci);
        return $(td)
    };
    fn.getCellHeader = function(ui) {
        if (ui.vci >= 0) ui.colIndx = this.iCols.getci(ui.vci);
        var obj = this.normalize(ui),
            ci = obj.colIndx,
            rowIndx = obj.ri,
            ri = rowIndx >= 0 ? rowIndx : this.headerCells.length - 1,
            th = this.iRenderHead.getCell(ri, ci);
        return $(th)
    };
    fn.getCellFilter = function(ui) {
        ui.ri = this.headerCells.length;
        return this.getCellHeader(ui)
    };
    fn.getEditorIndices = function() {
        var obj = this.options.editModel.indices;
        if (!obj) {
            return null
        } else {
            return $.extend({}, obj)
        }
    };
    fn.getEditCellData = function() {
        var o = this.options,
            EM = o.editModel,
            obj = EM.indices;
        if (!obj) {
            return null
        }
        var colIndx = obj.colIndx,
            rowIndxPage = obj.rowIndxPage,
            rowIndx = obj.rowIndx,
            column = this.colModel[colIndx],
            ceditor = column.editor,
            geditor = o.editor,
            editor = ceditor ? $.extend({}, geditor, ceditor) : geditor,
            ed_valueIndx = editor.valueIndx,
            ed_labelIndx = editor.labelIndx,
            ed_mapIndices = editor.mapIndices,
            ed_mapIndices = ed_mapIndices ? ed_mapIndices : {},
            dataIndx = column.dataIndx,
            $div_focus = this.$div_focus,
            $cell = $div_focus.children(".pq-editor-inner"),
            dataCell;
        var getData = EM._getData || editor.getData;
        EM._getData = undefined;
        if (getData) {
            dataCell = this.callFn(getData, {
                $cell: $cell,
                rowData: obj.rowData,
                dataIndx: dataIndx,
                rowIndx: rowIndx,
                rowIndxPage: rowIndxPage,
                column: column,
                colIndx: colIndx
            })
        } else {
            var edtype = geditor._type;
            if (edtype === "checkbox") {
                var $ele = $cell.children();
                if (editor.subtype === "triple") {
                    dataCell = $ele.pqval()
                } else {
                    dataCell = $ele.is(":checked") ? true : false
                }
            } else if (edtype === "contenteditable") {
                dataCell = $cell.children().html()
            } else {
                var $ed = $cell.find('*[name="' + dataIndx + '"]');
                if ($ed && $ed.length) {
                    if (edtype === "select" && ed_valueIndx !== null) {
                        if (!ed_mapIndices[ed_valueIndx] && !this.columns[ed_valueIndx]) {
                            dataCell = $ed.val()
                        } else {
                            dataCell = {};
                            dataCell[ed_mapIndices[ed_valueIndx] ? ed_mapIndices[ed_valueIndx] : ed_valueIndx] = $ed.val();
                            dataCell[ed_mapIndices[ed_labelIndx] ? ed_mapIndices[ed_labelIndx] : ed_labelIndx] = $ed.find("option:selected").text();
                            var dataMap = editor.dataMap;
                            if (dataMap) {
                                var jsonMap = $ed.find("option:selected").data("map");
                                if (jsonMap) {
                                    for (var k = 0; k < dataMap.length; k++) {
                                        var key = dataMap[k];
                                        dataCell[ed_mapIndices[key] ? ed_mapIndices[key] : key] = jsonMap[key]
                                    }
                                }
                            }
                        }
                    } else {
                        dataCell = $ed.val()
                    }
                } else {
                    var $ed = $cell.find(".pq-editor-focus");
                    if ($ed && $ed.length) {
                        dataCell = $ed.val()
                    }
                }
            }
        }
        return dataCell
    };
    fn.getCellIndices = function(objP) {
        var $td = objP.$td,
            arr;
        if ($td === null || $td.length === 0 || $td.closest(".pq-grid")[0] !== this.element[0]) {
            return {}
        }
        arr = this.iRenderB.getCellIndx($td[0]);
        return arr ? this.iMerge.getRootCellO(arr[0] + this.riOffset, arr[1], true) : {}
    };
    fn.getRowsByClass = function(obj) {
        var options = this.options,
            DM = options.dataModel,
            PM = options.pageModel,
            remotePaging = PM.type === "remote",
            offset = this.riOffset,
            data = DM.data,
            rows = [];
        if (data === null) {
            return rows
        }
        for (var i = 0, len = data.length; i < len; i++) {
            var rd = data[i];
            if (rd.pq_rowcls) {
                obj.rowData = rd;
                if (this.hasClass(obj)) {
                    var row = {
                            rowData: rd
                        },
                        ri = remotePaging ? i + offset : i,
                        rip = ri - offset;
                    row.rowIndx = ri;
                    row.rowIndxPage = rip;
                    rows.push(row)
                }
            }
        }
        return rows
    };
    fn.getCellsByClass = function(obj) {
        var that = this,
            options = this.options,
            DM = options.dataModel,
            PM = options.pageModel,
            remotePaging = PM.type === "remote",
            offset = this.riOffset,
            data = DM.data,
            cells = [];
        if (data === null) {
            return cells
        }
        for (var i = 0, len = data.length; i < len; i++) {
            var rd = data[i],
                ri = remotePaging ? i + offset : i,
                cellcls = rd.pq_cellcls;
            if (cellcls) {
                for (var di in cellcls) {
                    var ui = {
                        rowData: rd,
                        rowIndx: ri,
                        dataIndx: di,
                        cls: obj.cls
                    };
                    if (that.hasClass(ui)) {
                        var cell = that.normalize(ui);
                        cells.push(cell)
                    }
                }
            }
        }
        return cells
    };
    fn.data = function(objP) {
        var dataIndx = objP.dataIndx,
            colIndx = objP.colIndx,
            dataIndx = colIndx !== null ? this.colModel[colIndx].dataIndx : dataIndx,
            data = objP.data,
            readOnly = data === null || typeof data === "string" ? true : false,
            rowData = objP.rowData || this.getRowData(objP);
        if (!rowData) {
            return {
                data: null
            }
        }
        if (dataIndx === null) {
            var rowdata = rowData.pq_rowdata;
            if (readOnly) {
                var ret;
                if (rowdata !== null) {
                    if (data === null) {
                        ret = rowdata
                    } else {
                        ret = rowdata[data]
                    }
                }
                return {
                    data: ret
                }
            }
            var finalData = $.extend(true, rowData.pq_rowdata, data);
            rowData.pq_rowdata = finalData
        } else {
            var celldata = rowData.pq_celldata;
            if (readOnly) {
                var ret;
                if (celldata !== null) {
                    var a = celldata[dataIndx];
                    if (data === null || a === null) {
                        ret = a
                    } else {
                        ret = a[data]
                    }
                }
                return {
                    data: ret
                }
            }
            if (!celldata) {
                rowData.pq_celldata = {}
            }
            var finalData = $.extend(true, rowData.pq_celldata[dataIndx], data);
            rowData.pq_celldata[dataIndx] = finalData
        }
    };
    fn.attr = function(objP) {
        var rowIndx = objP.rowIndx,
            dataIndx = objP.dataIndx,
            colIndx = objP.colIndx,
            dataIndx = colIndx !== null ? this.colModel[colIndx].dataIndx : dataIndx,
            attr = objP.attr,
            readOnly = attr === null || typeof attr === "string" ? true : false,
            offset = this.riOffset,
            refresh = objP.refresh,
            rowData = objP.rowData || this.getRowData(objP);
        if (!rowData) {
            return {
                attr: null
            }
        }
        if (!readOnly && refresh !== false && rowIndx === null) {
            rowIndx = this.getRowIndx({
                rowData: rowData
            }).rowIndx
        }
        if (dataIndx === null) {
            var rowattr = rowData.pq_rowattr;
            if (readOnly) {
                var ret;
                if (rowattr !== null) {
                    if (attr === null) {
                        ret = rowattr
                    } else {
                        ret = rowattr[attr]
                    }
                }
                return {
                    attr: ret
                }
            }
            var finalAttr = $.extend(true, rowData.pq_rowattr, attr);
            rowData.pq_rowattr = finalAttr;
            if (refresh !== false && rowIndx !== null) {
                var $tr = this.getRow({
                    rowIndxPage: rowIndx - offset
                });
                if ($tr) {
                    var strFinalAttr = this.stringifyAttr(finalAttr);
                    $tr.attr(strFinalAttr)
                }
            }
        } else {
            var cellattr = rowData.pq_cellattr;
            if (readOnly) {
                var ret;
                if (cellattr !== null) {
                    var a = cellattr[dataIndx];
                    if (attr === null || a === null) {
                        ret = a
                    } else {
                        ret = a[attr]
                    }
                }
                return {
                    attr: ret
                }
            }
            if (!cellattr) {
                rowData.pq_cellattr = {}
            }
            var finalAttr = $.extend(true, rowData.pq_cellattr[dataIndx], attr);
            rowData.pq_cellattr[dataIndx] = finalAttr;
            if (refresh !== false && rowIndx !== null) {
                var $td = this.getCell({
                    rowIndxPage: rowIndx - offset,
                    dataIndx: dataIndx
                });
                if ($td) {
                    var strFinalAttr = this.stringifyAttr(finalAttr);
                    $td.attr(strFinalAttr)
                }
            }
        }
    };
    fn.stringifyAttr = function(attr) {
        var newAttr = {};
        for (var key in attr) {
            var val = attr[key];
            if (val) {
                if (key === "title") {
                    val = val.replace(/\"/g, "&quot;");
                    newAttr[key] = val
                } else if (key === "style" && typeof val === "object") {
                    var val2 = [],
                        val22;
                    for (var kk in val) {
                        val22 = val[kk];
                        if (val22) {
                            val2.push(kk + ":" + val22)
                        }
                    }
                    val = val2.join(";") + (val2.length ? ";" : "");
                    if (val) {
                        newAttr[key] = val
                    }
                } else {
                    if (typeof val === "object") {
                        val = JSON.stringify(val)
                    }
                    newAttr[key] = val
                }
            }
        }
        return newAttr
    };
    fn.removeData = function(objP) {
        var dataIndx = objP.dataIndx,
            colIndx = objP.colIndx,
            dataIndx = colIndx !== null ? this.colModel[colIndx].dataIndx : dataIndx,
            data = objP.data,
            data = data === null ? [] : data,
            datas = typeof data === "string" ? data.split(" ") : data,
            datalen = datas.length,
            rowData = objP.rowData || this.getRowData(objP);
        if (!rowData) {
            return
        }
        if (dataIndx === null) {
            var rowdata = rowData.pq_rowdata;
            if (rowdata) {
                if (datalen) {
                    for (var i = 0; i < datalen; i++) {
                        var key = datas[i];
                        delete rowdata[key]
                    }
                }
                if (!datalen || $.isEmptyObject(rowdata)) {
                    delete rowData.pq_rowdata
                }
            }
        } else {
            var celldata = rowData.pq_celldata;
            if (celldata && celldata[dataIndx]) {
                var a = celldata[dataIndx];
                if (datalen) {
                    for (var i = 0; i < datalen; i++) {
                        var key = datas[i];
                        delete a[key]
                    }
                }
                if (!datalen || $.isEmptyObject(a)) {
                    delete celldata[dataIndx]
                }
            }
        }
    };
    fn.removeAttr = function(objP) {
        var rowIndx = objP.rowIndx,
            dataIndx = objP.dataIndx,
            colIndx = objP.colIndx,
            dataIndx = colIndx !== null ? this.colModel[colIndx].dataIndx : dataIndx,
            attr = objP.attr,
            attr = attr === null ? [] : attr,
            attrs = typeof attr === "string" ? attr.split(" ") : attr,
            attrlen = attrs.length,
            rowIndxPage = rowIndx - this.riOffset,
            refresh = objP.refresh,
            rowData = objP.rowData || this.getRowData(objP);
        if (!rowData) {
            return
        }
        if (refresh !== false && rowIndx === null) {
            rowIndx = this.getRowIndx({
                rowData: rowData
            }).rowIndx
        }
        if (dataIndx === null) {
            var rowattr = rowData.pq_rowattr;
            if (rowattr) {
                if (attrlen) {
                    for (var i = 0; i < attrlen; i++) {
                        var key = attrs[i];
                        delete rowattr[key]
                    }
                } else {
                    for (var key in rowattr) {
                        attrs.push(key)
                    }
                }
                if (!attrlen || $.isEmptyObject(rowattr)) {
                    delete rowData.pq_rowattr
                }
            }
            if (refresh !== false && rowIndx !== null && attrs.length) {
                attr = attrs.join(" ");
                var $tr = this.getRow({
                    rowIndxPage: rowIndxPage
                });
                if ($tr) {
                    $tr.removeAttr(attr)
                }
            }
        } else {
            var cellattr = rowData.pq_cellattr;
            if (cellattr && cellattr[dataIndx]) {
                var a = cellattr[dataIndx];
                if (attrlen) {
                    for (var i = 0; i < attrlen; i++) {
                        var key = attrs[i];
                        delete a[key]
                    }
                } else {
                    for (var key in a) {
                        attrs.push(key)
                    }
                }
                if (!attrlen || $.isEmptyObject(a)) {
                    delete cellattr[dataIndx]
                }
            }
            if (refresh !== false && rowIndx !== null && attrs.length) {
                attr = attrs.join(" ");
                var $td = this.getCell({
                    rowIndxPage: rowIndxPage,
                    dataIndx: dataIndx
                });
                if ($td) {
                    $td.removeAttr(attr)
                }
            }
        }
    };
    fn.normalize = function(ui, data) {
        var obj = {},
            offset, CM, key;
        for (key in ui) {
            obj[key] = ui[key]
        }
        var ri = obj.rowIndx,
            rip = obj.rowIndxPage,
            di = obj.dataIndx,
            ci = obj.colIndx;
        if (rip !== null || ri !== null) {
            offset = this.riOffset;
            ri = ri === null ? rip * 1 + offset : ri;
            rip = rip === null ? ri * 1 - offset : rip;
            obj.rowIndx = ri;
            obj.rowIndxPage = rip;
            obj.rowData = obj.rowData || data && data[ri] || this.getRowData(obj)
        }
        if (ci !== null || di !== null) {
            CM = this.colModel;
            di = di === null ? CM[ci] ? CM[ci].dataIndx : undefined : di, ci = ci === null ? this.colIndxs[di] : ci;
            obj.column = CM[ci];
            obj.colIndx = ci;
            obj.dataIndx = di
        }
        return obj
    };
    fn.normalizeList = function(list) {
        var self = this,
            data = self.get_p_data();
        return list.map(function(rObj) {
            return self.normalize(rObj, data)
        })
    };
    fn.addClass = function(_objP) {
        var objP = this.normalize(_objP),
            rip = objP.rowIndxPage,
            dataIndx = objP.dataIndx,
            uniqueArray = pq.arrayUnique,
            objcls = objP.cls,
            newcls, refresh = objP.refresh,
            rowData = objP.rowData;
        if (!rowData) {
            return
        }
        if (refresh !== false && rip === null) {
            rip = this.getRowIndx({
                rowData: rowData
            }).rowIndxPage
        }
        if (dataIndx === null) {
            var rowcls = rowData.pq_rowcls;
            if (rowcls) {
                newcls = rowcls + " " + objcls
            } else {
                newcls = objcls
            }
            newcls = uniqueArray(newcls.split(/\s+/)).join(" ");
            rowData.pq_rowcls = newcls;
            if (refresh !== false && rip !== null && this.SelectRow().inViewRow(rip)) {
                var $tr = this.getRow({
                    rowIndxPage: rip
                });
                if ($tr) {
                    $tr.addClass(objcls)
                }
            }
        } else {
            var dataIndxs = [];
            if (typeof dataIndx.push !== "function") {
                dataIndxs.push(dataIndx)
            } else {
                dataIndxs = dataIndx
            }
            var pq_cellcls = rowData.pq_cellcls;
            if (!pq_cellcls) {
                pq_cellcls = rowData.pq_cellcls = {}
            }
            for (var j = 0, len = dataIndxs.length; j < len; j++) {
                dataIndx = dataIndxs[j];
                var cellcls = pq_cellcls[dataIndx];
                if (cellcls) {
                    newcls = cellcls + " " + objcls
                } else {
                    newcls = objcls
                }
                newcls = uniqueArray(newcls.split(/\s+/)).join(" ");
                pq_cellcls[dataIndx] = newcls;
                if (refresh !== false && rip !== null && this.SelectRow().inViewRow(rip)) {
                    var $td = this.getCell({
                        rowIndxPage: rip,
                        dataIndx: dataIndx
                    });
                    if ($td) {
                        $td.addClass(objcls)
                    }
                }
            }
        }
    };
    fn.removeClass = function(_objP) {
        var objP = this.normalize(_objP),
            rowIndx = objP.rowIndx,
            rowData = objP.rowData,
            dataIndx = objP.dataIndx,
            cls = objP.cls,
            refresh = objP.refresh;
        if (!rowData) {
            return
        }
        var pq_cellcls = rowData.pq_cellcls,
            pq_rowcls = rowData.pq_rowcls;
        if (refresh !== false && rowIndx === null) {
            rowIndx = this.getRowIndx({
                rowData: rowData
            }).rowIndx
        }
        if (dataIndx === null) {
            if (pq_rowcls) {
                rowData.pq_rowcls = this._removeClass(pq_rowcls, cls);
                if (rowIndx !== null && refresh !== false) {
                    var $tr = this.getRow({
                        rowIndx: rowIndx
                    });
                    if ($tr) {
                        $tr.removeClass(cls)
                    }
                }
            }
        } else if (pq_cellcls) {
            var dataIndxs = [];
            if (typeof dataIndx.push !== "function") {
                dataIndxs.push(dataIndx)
            } else {
                dataIndxs = dataIndx
            }
            for (var i = 0, len = dataIndxs.length; i < len; i++) {
                dataIndx = dataIndxs[i];
                var cellClass = pq_cellcls[dataIndx];
                if (cellClass) {
                    rowData.pq_cellcls[dataIndx] = this._removeClass(cellClass, cls);
                    if (rowIndx !== null && refresh !== false) {
                        var $td = this.getCell({
                            rowIndx: rowIndx,
                            dataIndx: dataIndx
                        });
                        if ($td) {
                            $td.removeClass(cls)
                        }
                    }
                }
            }
        }
    };
    fn.hasClass = function(obj) {
        var dataIndx = obj.dataIndx,
            cls = obj.cls,
            rowData = this.getRowData(obj),
            re = new RegExp("\\b" + cls + "\\b"),
            str;
        if (rowData) {
            if (dataIndx === null) {
                str = rowData.pq_rowcls;
                if (str && re.test(str)) {
                    return true
                } else {
                    return false
                }
            } else {
                var objCls = rowData.pq_cellcls;
                if (objCls && objCls[dataIndx] && re.test(objCls[dataIndx])) {
                    return true
                } else {
                    return false
                }
            }
        } else {
            return null
        }
    };
    fn._removeClass = function(str, str2) {
        if (str && str2) {
            var arr = str.split(/\s+/),
                arr2 = str2.split(/\s+/),
                arr3 = [];
            for (var i = 0, len = arr.length; i < len; i++) {
                var cls = arr[i],
                    found = false;
                for (var j = 0, len2 = arr2.length; j < len2; j++) {
                    var cls2 = arr2[j];
                    if (cls === cls2) {
                        found = true;
                        break
                    }
                }
                if (!found) {
                    arr3.push(cls)
                }
            }
            if (arr3.length > 1) {
                return arr3.join(" ")
            } else if (arr3.length === 1) {
                return arr3[0]
            } else {
                return null
            }
        }
    };
    fn.getRowIndx = function(obj) {
        var $tr = obj.$tr,
            rowData = obj.rowData,
            rowIndxPage, rowIndx, ri, offset = this.riOffset;
        if (rowData) {
            if ((ri = rowData.pq_ri) !== null) {
                return {
                    rowData: rowData,
                    rowIndx: ri,
                    rowIndxPage: ri - offset
                }
            }
            var data = this.get_p_data(),
                uf = false,
                dataUF = obj.dataUF ? this.options.dataModel.dataUF : null,
                _found = false;
            if (data) {
                for (var i = 0, len = data.length; i < len; i++) {
                    if (data[i] === rowData) {
                        _found = true;
                        break
                    }
                }
            }
            if (!_found && dataUF) {
                uf = true;
                for (var i = 0, len = dataUF.length; i < len; i++) {
                    if (dataUF[i] === rowData) {
                        _found = true;
                        break
                    }
                }
            }
            if (_found) {
                rowIndxPage = i - offset;
                rowIndx = i;
                return {
                    rowIndxPage: uf ? undefined : rowIndxPage,
                    uf: uf,
                    rowIndx: rowIndx,
                    rowData: rowData
                }
            } else {
                return {}
            }
        } else {
            if ($tr === null || $tr.length === 0) {
                return {}
            }
            rowIndxPage = this.iRenderB.getRowIndx($tr[0])[0];
            if (rowIndxPage === null) {
                return {}
            }
            return {
                rowIndxPage: rowIndxPage,
                rowIndx: rowIndxPage + offset
            }
        }
    };
    fn.search = function(ui) {
        var o = this.options,
            row = ui.row,
            first = ui.first,
            DM = o.dataModel,
            PM = o.pageModel,
            paging = PM.type,
            rowList = [],
            offset = this.riOffset,
            remotePaging = paging === "remote",
            data = DM.data;
        for (var i = 0, len = data.length; i < len; i++) {
            var rowData = data[i],
                _found = true;
            for (var dataIndx in row) {
                if (row[dataIndx] !== rowData[dataIndx]) {
                    _found = false
                }
            }
            if (_found) {
                var ri = remotePaging ? i + offset : i,
                    obj = this.normalize({
                        rowIndx: ri
                    });
                rowList.push(obj);
                if (first) {
                    break
                }
            }
        }
        return rowList
    };
    fn.getFirstVisibleRIP = function(view) {
        var data = this.pdata,
            i = view ? this.iRenderB.initV : 0,
            len = data.length;
        for (; i < len; i++) {
            if (!data[i].pq_hidden) {
                return i
            }
        }
    };
    fn.getLastVisibleRIP = function() {
        var data = this.pdata;
        for (var i = data.length - 1; i >= 0; i--) {
            if (!data[i].pq_hidden) {
                return i
            }
        }
        return null
    };
    fn.getFirstVisibleCI = function(ci) {
        return this.iCols.getFirstVisibleCI()
    };
    fn.getLastVisibleCI = function() {
        return this.iCols.getLastVisibleCI()
    };
    fn.getNextVisibleCI = function(ci) {
        return this.iCols.getNextVisibleCI(ci)
    };
    fn.getPrevVisibleCI = function(ci) {
        return this.iCols.getPrevVisibleCI(ci)
    };
    fn.calcWidthCols = function(colIndx1, colIndx2, _direct) {
        var wd = 0,
            o = this.options,
            cbWidth = 0,
            numberCell = o.numberCell,
            CM = this.colModel;
        if (colIndx1 === -1) {
            if (numberCell.show) {
                if (_direct) {
                    wd += numberCell.width * 1
                } else {
                    wd += numberCell.outerWidth
                }
            }
            colIndx1 = 0
        }
        if (_direct) {
            for (var i = colIndx1; i < colIndx2; i++) {
                var column = CM[i];
                if (column && !column.hidden) {
                    if (!column._width) {
                        throw "assert failed"
                    }
                    wd += column._width + cbWidth
                }
            }
        } else {
            for (var i = colIndx1; i < colIndx2; i++) {
                var column = CM[i];
                if (column && !column.hidden) {
                    wd += column.outerWidth
                }
            }
        }
        return wd
    }
})(jQuery);
(function($) {
    var cKeyNav = $.paramquery.cKeyNav = function(that) {
        this.that = that
    };
    cKeyNav.prototype = {
        bodyKeyPressDown: function(evt) {
            var self = this,
                that = self.that,
                offset = that.riOffset,
                rowIndx, rowIndxPage, colIndx, o = that.options,
                FM = o.formulasModel,
                iM = that.iMerge,
                _fe = that._focusEle,
                CM = that.colModel,
                SM = o.selectionModel,
                EM = o.editModel,
                ac = document.activeElement,
                $target, ctrlMeta = pq.isCtrl(evt),
                KC = $.ui.keyCode,
                keyCode = evt.keyCode;
            if (EM.indices) {
                that.$div_focus.find(".pq-cell-focus").focus();
                return
            }
            $target = $(evt.target);
            if ($target.hasClass("pq-grid-cell")) {
                _fe = that.getCellIndices({
                    $td: $target
                })
            } else {
                if (ac.id !== "pq-grid-excel" && ac.className !== "pq-body-outer") {
                    return
                }
            }
            if (keyCode === KC.SPACE && $target[0] === that.$cont[0]) {
                return false
            }
            var cell = that.normalize(_fe),
                rowIndxPage = cell.rowIndxPage,
                rowIndx = cell.rowIndx,
                colIndx = cell.colIndx,
                pqN, rip2, pdata = that.pdata,
                uiTrigger = cell,
                preventDefault = true;
            if (rowIndx === null || colIndx === null || cell.rowData === null) {
                return
            }
            if (iM.ismergedCell(rowIndx, colIndx)) {
                uiTrigger = iM.getRootCellO(rowIndx, colIndx);
                cell = uiTrigger;
                rowIndxPage = cell.rowIndxPage;
                rowIndx = cell.rowIndx;
                colIndx = cell.colIndx;
                if (keyCode === KC.PAGE_UP || keyCode === KC.PAGE_DOWN || keyCode === KC.HOME || keyCode === KC.END) {
                    if (pqN = iM.getData(rowIndx, colIndx, "proxy_cell")) {
                        rip2 = pqN.rowIndx - offset;
                        if (!pdata[rip2].pq_hidden) {
                            rowIndxPage = rip2;
                            rowIndx = rowIndxPage + offset
                        }
                    }
                }
                if (CM[colIndx].hidden) {
                    colIndx = that.getNextVisibleCI(colIndx)
                }
            }
            if (that._trigger("beforeCellKeyDown", evt, uiTrigger) === false) {
                return false
            }
            that._trigger("cellKeyDown", evt, uiTrigger);
            if (keyCode === KC.LEFT || keyCode === KC.RIGHT || keyCode === KC.UP || keyCode === KC.DOWN || SM.onTab && keyCode === KC.TAB) {
                var obj = null;
                if (keyCode === KC.LEFT || keyCode === KC.TAB && evt.shiftKey) {
                    obj = this.incrIndx(rowIndxPage, colIndx, false)
                } else if (keyCode === KC.RIGHT || keyCode === KC.TAB && !evt.shiftKey) {
                    obj = this.incrIndx(rowIndxPage, colIndx, true)
                } else if (keyCode === KC.UP) {
                    obj = this.incrRowIndx(rowIndxPage, colIndx, false)
                } else if (keyCode === KC.DOWN) {
                    obj = this.incrRowIndx(rowIndxPage, colIndx, true)
                }
                if (obj) {
                    rowIndx = obj.rowIndxPage + offset;
                    this.select({
                        rowIndx: rowIndx,
                        colIndx: obj.colIndx,
                        evt: evt
                    })
                }
            } else if (keyCode === KC.PAGE_DOWN || keyCode === KC.PAGE_UP) {
                var fn = keyCode === KC.PAGE_UP ? "pageUp" : "pageDown";
                that.iRenderB[fn](rowIndxPage, function(rip) {
                    rowIndx = rip + offset;
                    self.select({
                        rowIndx: rowIndx,
                        colIndx: colIndx,
                        evt: evt
                    })
                })
            } else if (keyCode === KC.HOME) {
                if (ctrlMeta) {
                    rowIndx = that.getFirstVisibleRIP() + offset
                } else {
                    colIndx = that.getFirstVisibleCI()
                }
                this.select({
                    rowIndx: rowIndx,
                    colIndx: colIndx,
                    evt: evt
                })
            } else if (keyCode === KC.END) {
                if (ctrlMeta) {
                    rowIndx = that.getLastVisibleRIP() + offset
                } else {
                    colIndx = that.getLastVisibleCI()
                }
                this.select({
                    rowIndx: rowIndx,
                    colIndx: colIndx,
                    evt: evt
                })
            } else if (keyCode === KC.ENTER) {
                var $td = that.getCell(uiTrigger);
                if ($td && $td.length > 0) {
                    if (that.isEditable(uiTrigger)) {
                        that.editCell(uiTrigger)
                    } else {
                        var $button = $td.find("button");
                        if ($button.length) {
                            $($button[0]).click()
                        }
                    }
                }
            } else if (ctrlMeta && keyCode === "65") {
                var iSel = that.iSelection;
                if (SM.type === "row" && SM.mode !== "single") {
                    that.iRows.toggleAll({
                        all: SM.all
                    })
                } else if (SM.type === "cell" && SM.mode !== "single") {
                    iSel.selectAll({
                        type: "cell",
                        all: SM.all
                    })
                }
            } else if (EM.pressToEdit && (this.isEditKey(keyCode) || FM.on && keyCode === 187) && !ctrlMeta) {
                if (keyCode === 46) {
                    that.clear()
                } else {
                    rowIndxPage = uiTrigger.rowIndxPage;
                    colIndx = uiTrigger.colIndx;
                    $td = that.getCell(uiTrigger);
                    if ($td && $td.length) {
                        if (that.isEditable(uiTrigger)) {
                            that.editCell({
                                rowIndxPage: rowIndxPage,
                                colIndx: colIndx,
                                select: true
                            })
                        }
                    }
                    preventDefault = false
                }
            } else {
                preventDefault = false
            }
            if (preventDefault) {
                evt.preventDefault()
            }
        },
        getPrevVisibleRIP: function(rowIndxPage) {
            var data = this.that.pdata;
            for (var i = rowIndxPage - 1; i >= 0; i--) {
                if (!data[i].pq_hidden) {
                    return i
                }
            }
            return rowIndxPage
        },
        setDataMergeCell: function(rowIndx, colIndx) {
            var that = this.that,
                iM = that.iMerge,
                obj, obj_o;
            if (iM.ismergedCell(rowIndx, colIndx)) {
                obj_o = iM.getRootCellO(rowIndx, colIndx);
                iM.setData(obj_o.rowIndx, obj_o.colIndx, {
                    proxy_cell: {
                        rowIndx: rowIndx,
                        colIndx: colIndx
                    }
                })
            }
        },
        getValText: function($editor) {
            var nodeName = $editor[0].nodeName.toLowerCase(),
                valsarr = ["input", "textarea", "select"],
                byVal = "text";
            if ($.inArray(nodeName, valsarr) !== -1) {
                byVal = "val"
            }
            return byVal
        },
        getNextVisibleRIP: function(rowIndxPage) {
            var data = this.that.pdata;
            for (var i = rowIndxPage + 1, len = data.length; i < len; i++) {
                if (!data[i].pq_hidden) {
                    return i
                }
            }
            return rowIndxPage
        },
        incrEditIndx: function(rowIndxPage, colIndx, incr) {
            var that = this.that,
                CM = that.colModel,
                CMLength = CM.length,
                iM = that.iMerge,
                column, offset = that.riOffset,
                lastRowIndxPage = that[incr ? "getLastVisibleRIP" : "getFirstVisibleRIP"]();
            do {
                var rowIndx = rowIndxPage + offset,
                    m;
                if (iM.ismergedCell(rowIndx, colIndx)) {
                    m = iM.getRootCell(rowIndx, colIndx);
                    var pqN = iM.getData(rowIndx, colIndx, "proxy_edit_cell");
                    if (pqN) {
                        rowIndx = pqN.rowIndx;
                        rowIndxPage = rowIndx - offset
                    }
                    colIndx = incr ? colIndx + m.o_cc : colIndx - 1
                } else {
                    colIndx = incr ? colIndx + 1 : colIndx - 1
                }
                if (incr && colIndx >= CMLength || !incr && colIndx < 0) {
                    if (rowIndxPage === lastRowIndxPage) {
                        return null
                    }
                    rowIndxPage = this[incr ? "getNextVisibleRIP" : "getPrevVisibleRIP"](rowIndxPage);
                    colIndx = incr ? 0 : CMLength - 1
                }
                rowIndx = rowIndxPage + offset;
                if (iM.ismergedCell(rowIndx, colIndx)) {
                    m = iM.getRootCellO(rowIndx, colIndx);
                    iM.setData(m.rowIndx, m.colIndx, {
                        proxy_edit_cell: {
                            rowIndx: rowIndx,
                            colIndx: colIndx
                        }
                    });
                    rowIndx = m.rowIndx;
                    colIndx = m.colIndx
                }
                column = CM[colIndx];
                var isEditableCell = that.isEditable({
                        rowIndx: rowIndx,
                        colIndx: colIndx
                    }),
                    ceditor = column.editor,
                    ceditor = typeof ceditor === "function" ? ceditor.call(that, that.normalize({
                        rowIndx: rowIndx,
                        colIndx: colIndx
                    })) : ceditor;
                rowIndxPage = rowIndx - offset
            } while (column && (column.hidden || isEditableCell === false || ceditor === false));
            return {
                rowIndxPage: rowIndxPage,
                colIndx: colIndx
            }
        },
        incrIndx: function(rowIndxPage, colIndx, incr) {
            var that = this.that,
                iM = that.iMerge,
                m, pqN, rowIndx, rip2, column, pdata = that.pdata,
                offset = that.riOffset,
                lastRowIndxPage = that[incr ? "getLastVisibleRIP" : "getFirstVisibleRIP"](),
                lastColIndx = that[incr ? "getLastVisibleCI" : "getFirstVisibleCI"](),
                CM = that.colModel,
                CMLength = CM.length;
            if (colIndx === null) {
                if (rowIndxPage === lastRowIndxPage) {
                    return null
                }
                rowIndxPage = this[incr ? "getNextVisibleRIP" : "getPrevVisibleRIP"](rowIndxPage);
                return {
                    rowIndxPage: rowIndxPage
                }
            } else if (colIndx === lastColIndx) {
                return {
                    rowIndxPage: rowIndxPage,
                    colIndx: colIndx
                }
            }
            do {
                rowIndx = rowIndxPage + offset;
                if (iM.ismergedCell(rowIndx, colIndx)) {
                    m = iM.getRootCell(rowIndx, colIndx);
                    if (!column && (pqN = iM.getData(m.o_ri, m.o_ci, "proxy_cell"))) {
                        rip2 = pqN.rowIndx - offset;
                        if (!pdata[rip2].pq_hidden) {
                            rowIndxPage = rip2
                        }
                    }
                    if (pdata[rowIndxPage].pq_hidden) {
                        rowIndxPage = iM.getRootCellV(rowIndx, colIndx).rowIndxPage
                    }
                    if (!column && incr) {
                        colIndx = m.o_ci + (m.o_cc ? m.o_cc - 1 : 0)
                    }
                }
                if (incr) {
                    if (colIndx < CMLength - 1) colIndx++
                } else {
                    if (colIndx > 0) colIndx--
                }
                column = CM[colIndx]
            } while (column && column.hidden);
            return {
                rowIndxPage: rowIndxPage,
                colIndx: colIndx
            }
        },
        incrRowIndx: function(rip, ci, incr) {
            var that = this.that,
                offset = that.riOffset,
                ri = rip + offset,
                iM = that.iMerge,
                m, pqN;
            if (iM.ismergedCell(ri, ci)) {
                m = iM.getRootCell(ri, ci);
                pqN = iM.getData(m.o_ri, m.o_ci, "proxy_cell");
                if (incr) rip = m.o_ri - offset + m.o_rc - 1;
                ci = pqN ? pqN.colIndx : m.v_ci
            }
            rip = this[incr ? "getNextVisibleRIP" : "getPrevVisibleRIP"](rip);
            return {
                rowIndxPage: rip,
                colIndx: ci
            }
        },
        isEditKey: function(keyCode) {
            return keyCode >= 32 && keyCode <= 127 || keyCode === 189 || keyCode === 190
        },
        keyDownInEdit: function(evt) {
            var that = this.that,
                o = that.options,
                EMIndx = o.editModel.indices;
            if (!EMIndx) {
                return
            }
            var $this = $(evt.target),
                keyCodes = $.ui.keyCode,
                gEM = o.editModel,
                obj = $.extend({}, EMIndx),
                rowIndxPage = obj.rowIndxPage,
                colIndx = obj.colIndx,
                column = obj.column,
                cEM = column.editModel,
                EM = cEM ? $.extend({}, gEM, cEM) : gEM,
                byVal = this.getValText($this);
            $this.data("oldVal", $this[byVal]());
            if (that._trigger("editorKeyDown", evt, obj) === false) {
                return false
            }
            if (evt.keyCode === keyCodes.TAB || evt.keyCode === EM.saveKey) {
                var onSave = evt.keyCode === keyCodes.TAB ? EM.onTab : EM.onSave,
                    obj = {
                        rowIndxPage: rowIndxPage,
                        colIndx: colIndx,
                        incr: onSave ? true : false,
                        edit: onSave === "nextEdit"
                    };
                return this.saveAndMove(obj, evt)
            } else if (evt.keyCode === keyCodes.ESCAPE) {
                that.quitEditMode({
                    evt: evt
                });
                that.focus({
                    rowIndxPage: rowIndxPage,
                    colIndx: colIndx
                });
                evt.preventDefault();
                return false
            } else if (evt.keyCode === keyCodes.PAGE_UP || evt.keyCode === keyCodes.PAGE_DOWN) {
                evt.preventDefault();
                return false
            } else if (EM.keyUpDown && !evt.altKey) {
                if (evt.keyCode === keyCodes.DOWN) {
                    obj = this.incrRowIndx(rowIndxPage, colIndx, true);
                    return this.saveAndMove(obj, evt)
                } else if (evt.keyCode === keyCodes.UP) {
                    obj = this.incrRowIndx(rowIndxPage, colIndx, false);
                    return this.saveAndMove(obj, evt)
                }
            }
        },
        keyPressInEdit: function(evt, _objP) {
            var that = this.that,
                o = that.options,
                EMIndx = o.editModel.indices,
                objP = _objP || {},
                FK = objP.FK,
                column = EMIndx.column,
                KC = $.ui.keyCode,
                allowedKeys = ["BACKSPACE", "LEFT", "RIGHT", "UP", "DOWN", "DELETE", "HOME", "END"].map(function(kc) {
                    return KC[kc]
                }),
                dataType = column.dataType;
            if ($.inArray(evt.keyCode, allowedKeys) >= 0) {
                return true
            }
            if (that._trigger("editorKeyPress", evt, $.extend({}, EMIndx)) === false) {
                return false
            }
            if (FK && (dataType === "float" || dataType === "integer")) {
                var val = EMIndx.$editor.val(),
                    charsPermit = dataType === "float" ? "0123456789.-=" : "0123456789-=",
                    charC = evt.charCode || evt.keyCode,
                    chr = String.fromCharCode(charC);
                if (val[0] !== "=" && chr && charsPermit.indexOf(chr) === -1) {
                    return false
                }
            }
            return true
        },
        keyUpInEdit: function(evt, _objP) {
            var that = this.that,
                o = that.options,
                objP = _objP || {},
                FK = objP.FK,
                EM = o.editModel,
                EMIndices = EM.indices;
            that._trigger("editorKeyUp", evt, $.extend({}, EMIndices));
            var column = EMIndices.column,
                dataType = column.dataType;
            if (FK && (dataType === "float" || dataType === "integer")) {
                var $this = $(evt.target),
                    re = dataType === "integer" ? EM.reInt : EM.reFloat;
                var byVal = this.getValText($this);
                var oldVal = $this.data("oldVal");
                var newVal = $this[byVal]();
                if (re.test(newVal) === false && newVal[0] !== "=") {
                    if (re.test(oldVal)) {
                        $this[byVal](oldVal)
                    } else {
                        var val = dataType === "float" ? parseFloat(oldVal) : parseInt(oldVal);
                        if (isNaN(val)) {
                            $this[byVal](0)
                        } else {
                            $this[byVal](val)
                        }
                    }
                }
            }
        },
        saveAndMove: function(objP, evt) {
            if (objP === null) {
                evt.preventDefault();
                return false
            }
            var self = this,
                that = self.that,
                rowIndx, obj, rowIndxPage = objP.rowIndxPage,
                colIndx = objP.colIndx;
            that._blurEditMode = true;
            if (that.saveEditCell({
                    evt: evt
                }) === false || !that.pdata) {
                if (!that.pdata) {
                    that.quitEditMode(evt)
                }
                that._deleteBlurEditMode({
                    timer: true,
                    msg: "saveAndMove saveEditCell"
                });
                evt.preventDefault();
                return false
            }
            that.quitEditMode(evt);
            if (objP.incr) {
                obj = self[objP.edit ? "incrEditIndx" : "incrIndx"](rowIndxPage, colIndx, !evt.shiftKey);
                rowIndxPage = obj ? obj.rowIndxPage : rowIndxPage;
                colIndx = obj ? obj.colIndx : colIndx
            }
            that.scrollCell({
                rowIndxPage: rowIndxPage,
                colIndx: colIndx
            }, function() {
                rowIndx = rowIndxPage + that.riOffset;
                self.select({
                    rowIndx: rowIndx,
                    colIndx: colIndx,
                    evt: evt
                });
                if (objP.edit) {
                    that._editCell({
                        rowIndxPage: rowIndxPage,
                        colIndx: colIndx
                    })
                }
            });
            that._deleteBlurEditMode({
                timer: true,
                msg: "saveAndMove"
            });
            evt.preventDefault();
            return false
        },
        select: function(_objP) {
            var self = this,
                that = self.that,
                rowIndx = _objP.rowIndx,
                colIndx = _objP.colIndx,
                rowIndxPage = rowIndx - that.riOffset,
                evt = _objP.evt,
                objP = self.setDataMergeCell(rowIndx, colIndx),
                o = that.options,
                iSel = that.iSelection,
                SM = o.selectionModel,
                type = SM.type,
                type_row = type === "row",
                type_cell = type === "cell";
            that.scrollCell({
                rowIndx: rowIndx,
                colIndx: colIndx
            }, function() {
                var areas = iSel.address();
                if (evt.shiftKey && evt.keyCode !== $.ui.keyCode.TAB && SM.type && SM.mode !== "single" && (areas.length || type_row)) {
                    if (type_row) {
                        that.iRows.extend({
                            rowIndx: rowIndx,
                            evt: evt
                        })
                    } else {
                        var last = areas[areas.length - 1],
                            firstR = last.firstR,
                            firstC = last.firstC,
                            type = last.type,
                            expand = false;
                        if (type === "column") {
                            last.c1 = firstC;
                            last.c2 = colIndx;
                            last.r1 = last.r2 = last.type = undefined
                        } else {
                            areas = {
                                _type: "block",
                                r1: firstR,
                                r2: rowIndx,
                                c1: firstC,
                                c2: colIndx,
                                firstR: firstR,
                                firstC: firstC
                            };
                            expand = true
                        }
                        that.Range(areas, expand).select()
                    }
                } else {
                    if (type_row) {} else if (type_cell) {
                        that.Range({
                            r1: rowIndx,
                            c1: colIndx,
                            firstR: rowIndx,
                            firstC: colIndx
                        }).select()
                    }
                }
                that.focus({
                    rowIndxPage: rowIndxPage,
                    colIndx: colIndx
                })
            })
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        cGenerateView = _pq.cGenerateView = function(that) {};
    cGenerateView.prototype = {
        autoFitCols: function() {
            var that = this.that,
                CM = that.colModel,
                CMLength = CM.length,
                dims = this.dims,
                wdAllCols = that.calcWidthCols(-1, CMLength, true),
                sbWidth = this.getSBWd(),
                wdCont = dims.wdCenter - sbWidth;
            if (wdAllCols !== wdCont) {
                var diff = wdAllCols - wdCont,
                    columnResized, availWds = [];
                for (var i = 0; i < CMLength; i++) {
                    var column = CM[i],
                        colPercent = column._percent,
                        resizable = column.resizable !== false,
                        resized = column._resized,
                        hidden = column.hidden;
                    if (!hidden && !colPercent && !resized) {
                        var availWd;
                        if (diff < 0) {
                            availWd = column._maxWidth - column._width;
                            if (availWd) {
                                availWds.push({
                                    availWd: -1 * availWd,
                                    colIndx: i
                                })
                            }
                        } else {
                            availWd = column._width - column._minWidth;
                            if (availWd) {
                                availWds.push({
                                    availWd: availWd,
                                    colIndx: i
                                })
                            }
                        }
                    }
                    if (resized) {
                        columnResized = column;
                        delete column._resized
                    }
                }
                availWds.sort(function(obj1, obj2) {
                    if (obj1.availWd > obj2.availWd) {
                        return 1
                    } else if (obj1.availWd < obj2.availWd) {
                        return -1
                    } else {
                        return 0
                    }
                });
                for (var i = 0, len = availWds.length; i < len; i++) {
                    var obj = availWds[i],
                        availWd = obj.availWd,
                        colIndx = obj.colIndx,
                        part = Math.round(diff / (len - i)),
                        column = CM[colIndx],
                        wd, colWd = column._width;
                    if (Math.abs(availWd) > Math.abs(part)) {
                        wd = colWd - part;
                        diff = diff - part
                    } else {
                        wd = colWd - availWd;
                        diff = diff - availWd
                    }
                    column.width = column._width = wd
                }
                if (diff !== 0 && columnResized) {
                    var wd = columnResized._width - diff;
                    if (wd > columnResized._maxWidth) {
                        wd = columnResized._maxWidth
                    } else if (wd < columnResized._minWidth) {
                        wd = columnResized._minWidth
                    }
                    columnResized.width = columnResized._width = wd
                }
            }
        },
        computeOuterWidths: function() {
            var that = this.that,
                o = that.options,
                CBWidth = 0,
                numberCell = o.numberCell,
                thisColModel = that.colModel,
                CMLength = thisColModel.length;
            for (var i = 0; i < CMLength; i++) {
                var column = thisColModel[i];
                column.outerWidth = column._width + CBWidth
            }
            if (numberCell.show) {
                numberCell.outerWidth = numberCell.width
            }
        },
        numericVal: function(width, totalWidth) {
            var val;
            if ((width + "").indexOf("%") > -1) {
                val = parseInt(width) * totalWidth / 100
            } else {
                val = parseInt(width)
            }
            return Math.round(val)
        },
        refreshColumnWidths: function(ui) {
            ui = ui || {};
            var that = this.that,
                o = that.options,
                numberCell = o.numberCell,
                flexWidth = o.width === "flex",
                cbWidth = 0,
                CM = that.colModel,
                autoFit = this.autoFit,
                contWd = this.dims.wdCenter,
                CMLength = CM.length,
                sbWidth = 0,
                minColWidth = o.minColWidth,
                maxColWidth = o.maxColWidth;
            var numberCellWidth = 0;
            if (numberCell.show) {
                if (numberCell.width < numberCell.minWidth) {
                    numberCell.width = numberCell.minWidth
                }
                numberCellWidth = numberCell.outerWidth = numberCell.width
            }
            var availWidth = flexWidth ? null : contWd - sbWidth - numberCellWidth,
                minColWidth = Math.floor(this.numericVal(minColWidth, availWidth)),
                maxColWidth = Math.ceil(this.numericVal(maxColWidth, availWidth)),
                rem = 0;
            if (!flexWidth && availWidth < 5 || isNaN(availWidth)) {
                if (o.debug) {
                    throw "availWidth N/A"
                }
                return
            }
            delete that.percentColumn;
            for (var i = 0; i < CMLength; i++) {
                var column = CM[i],
                    hidden = column.hidden;
                if (hidden) {
                    continue
                }
                var colWidth = column.width,
                    colWidthPercent = (colWidth + "").indexOf("%") > -1 ? true : null,
                    colMinWidth = column.minWidth,
                    colMaxWidth = column.maxWidth,
                    colMinWidth = colMinWidth ? this.numericVal(colMinWidth, availWidth) : minColWidth,
                    colMaxWidth = colMaxWidth ? this.numericVal(colMaxWidth, availWidth) : maxColWidth;
                if (colMaxWidth < colMinWidth) {
                    colMaxWidth = colMinWidth
                }
                if (colWidth !== undefined) {
                    var wdFrac, wd = 0;
                    if (!flexWidth && colWidthPercent) {
                        that.percentColumn = true;
                        column.resizable = false;
                        column._percent = true;
                        wdFrac = this.numericVal(colWidth, availWidth) - cbWidth;
                        wd = Math.floor(wdFrac);
                        rem += wdFrac - wd;
                        if (rem >= 1) {
                            wd += 1;
                            rem -= 1
                        }
                    } else if (colWidth) {
                        wd = colWidth * 1
                    }
                    if (wd < colMinWidth) {
                        wd = colMinWidth
                    } else if (wd > colMaxWidth) {
                        wd = colMaxWidth
                    }
                    column._width = wd
                } else {
                    column._width = colMinWidth
                }
                if (!colWidthPercent) {
                    column.width = column._width
                }
                column._minWidth = colMinWidth;
                column._maxWidth = flexWidth ? 1e3 : colMaxWidth
            }
            if (flexWidth === false && ui.refreshWidth !== false) {
                if (autoFit) {
                    this.autoFitCols()
                }
            }
            this.computeOuterWidths()
        },
        format: function() {
            var dp = $.datepicker,
                formatNumber = pq.formatNumber;
            return function(cellData, format) {
                if (typeof format === "function") {
                    return format(cellData)
                }
                if (pq.isDateFormat(format)) {
                    if (cellData === parseInt(cellData)) {
                        return pq.formulas.TEXT(cellData, pq.juiToExcel(format))
                    } else if (isNaN(Date.parse(cellData))) {
                        return
                    }
                    return dp.formatDate(format, new Date(cellData))
                } else if (cellData === parseFloat(cellData)) {
                    return formatNumber(cellData, format)
                }
            }
        }(),
        renderCell: function(objP) {
            var that = this.that,
                attr = objP.attr || [],
                style = objP.style || [],
                dattr, dstyle, dcls, Export = objP.Export,
                o = that.options,
                cls = objP.cls || [],
                rowData = objP.rowData,
                column = objP.column,
                dataType = column.dataType,
                colIndx = objP.colIndx,
                dataIndx = column.dataIndx,
                freezeCols = o.freezeCols,
                render, columnBorders = o.columnBorders;
            if (!rowData) {
                return
            }
            if (!Export) {
                column.align && cls.push("pq-align-" + column.align);
                if (colIndx === freezeCols - 1 && columnBorders) {
                    cls.push("pq-last-frozen-col")
                }
                column.cls && cls.push(column.cls)
            }
            var dataCell, cellData = rowData[dataIndx],
                cellData = typeof cellData === "string" && dataType !== "html" ? pq.escapeHtml(cellData) : cellData,
                cellF, _cf = column.format || (cellF = rowData.pq_format) && (cellF = cellF[dataIndx]),
                formatVal = _cf ? this.format(cellData, _cf, dataType) : cellData;
            objP.dataIndx = dataIndx;
            objP.cellData = cellData;
            objP.formatVal = formatVal;
            if (render = column.render) {
                dataCell = that.callFn(render, objP);
                if (dataCell && typeof dataCell !== "string") {
                    (dattr = dataCell.attr) && attr.push(dattr);
                    (dcls = dataCell.cls) && cls.push(dcls);
                    (dstyle = dataCell.style) && style.push(dstyle);
                    dataCell = dataCell.text
                }
            }
            if (dataCell === null && (render = column._render)) {
                dataCell = render.call(that, objP)
            }
            if (dataCell && typeof dataCell !== "string") {
                (dattr = dataCell.attr) && attr.push(dattr);
                (dcls = dataCell.cls) && cls.push(dcls);
                (dstyle = dataCell.style) && style.push(dstyle);
                dataCell = dataCell.text
            }
            if (dataCell === null) {
                dataCell = formatVal || cellData
            }
            if (Export) {
                return [dataCell, dstyle]
            } else {
                var pq_cellcls = rowData.pq_cellcls;
                if (pq_cellcls) {
                    var cellClass = pq_cellcls[dataIndx];
                    if (cellClass) {
                        cls.push(cellClass)
                    }
                }
                var pq_cellattr = rowData.pq_cellattr;
                if (pq_cellattr) {
                    var cellattr = pq_cellattr[dataIndx];
                    if (cellattr) {
                        var newcellattr = that.stringifyAttr(cellattr);
                        for (var key in newcellattr) {
                            var val = newcellattr[key];
                            if (key === "style") {
                                style.push(val)
                            } else {
                                attr.push(key + '="' + val + '"')
                            }
                        }
                    }
                }
                style = style.length ? " style='" + style.join("") + "' " : "";
                if (dataCell === "" || dataCell === undefined) {
                    dataCell = "&nbsp;"
                }
                dataCell = pq.newLine(dataCell);
                var str = ["<div class='", cls.join(" "), "' ", attr.join(" "), style, " >", dataCell, "</div>"].join("");
                return str
            }
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        fn = _pq._pqGrid.prototype;
    fn.getHeadCell = function($td) {
        var arr = this.iRenderHead.getCellIndx($td[0]),
            ri = arr[0],
            ci = arr[1],
            isParent, column, cCM;
        if (ci !== null && ri !== null) {
            column = this.headerCells[ri];
            column && (column = column[ci]);
            if (column) {
                cCM = column.colModel
            }
        }
        if (cCM && cCM.length) {
            isParent = true
        }
        return {
            col: column || this.colModel[ci],
            ci: ci,
            ri: ri,
            isParent: isParent
        }
    };
    fn.flex = function(ui) {
        this.iResizeColumns.flex(ui)
    };
    _pq.cHeader = function(that, $h) {};
    _pq.cHeader.prototype = {
        onBeforeRefreshH: function(self, that) {
            return function() {
                var ae = document.activeElement,
                    cls = ae ? ae.className : "",
                    focusUI = self.focusUI,
                    $ae = $(ae);
                if (focusUI) {
                    focusUI.nofocus = cls.indexOf("pq-grid-col-leaf") === -1 || !$ae.closest(that.element).length
                }
            }
        },
        onRefreshH: function(self) {
            return function(evt) {
                self.setTimer(function() {
                    if (self.that.options) {
                        self.focus()
                    }
                }, 100)
            }
        },
        colCollapse: function(column, evt) {
            var that = this.that,
                ui = {
                    column: column
                },
                collapsible = column.collapsible;
            if (that._trigger("beforeColumnCollapse", evt, ui) !== false) {
                collapsible.on = !collapsible.on;
                if (that._trigger("columnCollapse", evt, ui) !== false) {
                    that.refresh({
                        colModel: true
                    })
                }
            }
        },
        onHeaderClick: function(evt) {
            var self = this,
                that = this.that,
                $td, column, obj, $target, iDG = that.iDragColumns;
            that._trigger("headerClick", evt);
            if (iDG && iDG.status !== "stop") {
                return
            }
            $target = $(evt.target);
            if ($target.is("input,label")) {
                return true
            }
            $td = $target.closest(".pq-grid-col");
            if ($td.length) {
                obj = that.getHeadCell($td);
                column = obj.col;
                if ($target.hasClass("pq-col-collapse")) {
                    self.colCollapse(column, evt)
                } else if (!obj.isParent) {
                    return self.onHeaderCellClick(column, obj.ci, evt)
                }
            }
        },
        getTitle: function(column, ci) {
            var title = column.title,
                t = typeof title === "function" ? title.call(this.that, {
                    column: column,
                    colIndx: ci,
                    dataIndx: column.dataIndx
                }) : title;
            return t
        },
        createHeaderCell: function(row, col, column, attr, cls, style) {
            var that = this.that,
                o = that.options,
                SSS = this.getSortSpaceSpans(o.sortModel),
                collapsedStr, collapsible = column.collapsible,
                tabindex = "",
                rowIndxDD, colIndxDD, align = column.halign || column.align,
                ccls = column.cls,
                cm = column.colModel,
                hasMenuH = this.hasMenuH(o, column),
                title = this.getTitle(column, col),
                title = title !== null ? title : column.dataIndx;
            column.pq_title = title;
            if (align) cls.push("pq-align-" + align);
            if (ccls) cls.push(ccls);
            cls.push(column.clsHead);
            if (hasMenuH) cls.push("pq-has-menu");
            if (!cm || !cm.length) {
                cls.push("pq-grid-col-leaf")
            } else {
                if (collapsible) {
                    cls.push("pq-collapsible-th");
                    collapsedStr = ["<span class='pq-col-collapse pq-icon-hover ui-icon ui-icon-", collapsible.on ? "plus" : "minus", "'></span>"].join("")
                }
            }
            rowIndxDD = "pq-row-indx=" + row;
            colIndxDD = "pq-col-indx=" + col;
            return ["<div ", colIndxDD, " ", rowIndxDD, " ", tabindex, " ", attr, " ", " class='", cls.join(" "), "' style='", style.join(""), "' >", "<div class='pq-td-div'>", collapsedStr, "<span class='pq-title-span'>", title, "</span>", SSS, "</div>", hasMenuH ? "<span class='pq-menu-icon'></span>" : "", "</div>"].join("")
        },
        getSortSpaceSpans: function(SM) {
            var pq_space = SM.space ? " pq-space" : "";
            return ["<span class='pq-col-sort-icon", pq_space, "'></span>", SM.number ? "<span class='pq-col-sort-count" + pq_space + "'></span>" : ""].join("")
        },
        hasMenuH: function(o, column) {
            var CM = column.colModel;
            if (CM && CM.length) {
                return false
            }
            var omenuH = o.menuIcon,
                colmenuH = column.menuIcon;
            return omenuH && colmenuH !== false || omenuH !== false && colmenuH
        },
        onHeaderCellClick: function(column, colIndx, evt) {
            var that = this.that,
                o = that.options,
                SM = o.sortModel,
                dataIndx = column.dataIndx;
            if (that._trigger("headerCellClick", evt, {
                    column: column,
                    colIndx: colIndx,
                    dataIndx: dataIndx
                }) === false) {
                return
            }
            if (o.selectionModel.column && evt.target.className.indexOf("pq-td-div") === -1) {
                var address = {
                        c1: colIndx,
                        firstC: colIndx
                    },
                    oldaddress = that.iSelection.address();
                if (evt.shiftKey) {
                    var alen = oldaddress.length;
                    if (alen && oldaddress[alen - 1].type === "column") {
                        var last = oldaddress[alen - 1];
                        last.c1 = last.firstC;
                        last.c2 = colIndx;
                        last.r1 = last.r2 = last.type = undefined
                    }
                    address = oldaddress
                }
                that.Range(address, false).select();
                that.focus({
                    rowIndxPage: that.getFirstVisibleRIP(true),
                    colIndx: colIndx
                })
            } else if (SM.on && (SM.wholeCell || $(evt.target).hasClass("pq-title-span"))) {
                if (column.sortable === false) {
                    return
                }
                that.sort({
                    sorter: [{
                        dataIndx: dataIndx,
                        sortIndx: column.sortIndx
                    }],
                    addon: true,
                    skipCustomSort: pq.isCtrl(evt),
                    tempMultiple: SM.multiKey && evt[SM.multiKey],
                    evt: evt
                })
            }
        },
        refreshHeaderSortIcons: function() {
            var that = this.that,
                o = that.options,
                BS = o.bootstrap,
                jui = o.ui,
                ri = that.headerCells.length - 1,
                $header = that.$header;
            if (!$header) {
                return
            }
            var sorters = that.iSort.getSorter(),
                sorterLen = sorters.length,
                number = false,
                SM = that.options.sortModel;
            if (SM.number && sorterLen > 1) {
                number = true
            }
            for (var i = 0; i < sorterLen; i++) {
                var sorter = sorters[i],
                    dataIndx = sorter.dataIndx,
                    ci = that.getColIndx({
                        dataIndx: dataIndx
                    }),
                    dir = sorter.dir;
                if (ci >= 0) {
                    var addClass = BS.on ? BS.header_active : jui.header_active + " pq-col-sort-" + (dir === "up" ? "asc" : "desc"),
                        cls2 = BS.on ? " glyphicon glyphicon-arrow-" + dir : "ui-icon ui-icon-triangle-1-" + (dir === "up" ? "n" : "s"),
                        $th = $(that.iRenderHead.getCell(ri, ci));
                    $th.addClass(addClass);
                    $th.find(".pq-col-sort-icon").addClass(cls2);
                    if (number) {
                        $th.find(".pq-col-sort-count").html(i + 1)
                    }
                }
            }
        }
    };
    _pq.cResizeColumns = function(that) {
        this.that = that;
        var self = this;
        that.$header.mouse();
        that.$header.on({
            mousedown: function(evt) {
                if (!evt.pq_composed) {
                    var $target = $(evt.target);
                    self.setDraggables(evt);
                    evt.pq_composed = true;
                    var e = $.Event("mousedown", evt);
                    $target.trigger(e)
                }
            },
            dblclick: function(evt) {
                self.doubleClick(evt)
            }
        }, ".pq-grid-col-resize-handle");
        var o = that.options,
            flex = o.flex;
        if (flex.on && flex.one) {
            that.one("ready", function() {
                self.flex()
            })
        }
    };
    _pq.cResizeColumns.prototype = {
        doubleClick: function(evt) {
            var that = this.that,
                o = that.options,
                flex = o.flex,
                $target = $(evt.target),
                colIndx = parseInt($target.attr("pq-col-indx"));
            if (isNaN(colIndx)) {
                return
            }
            if (flex.on) {
                this.flex(flex.all && !o.scrollModel.autoFit ? null : colIndx)
            }
        },
        flex: function(ci) {
            this.that.iRenderB.flex(ci)
        },
        setDraggables: function(evt) {
            var $div = $(evt.target),
                self = this;
            var drag_left, drag_new_left, cl_left;
            $div.draggable({
                axis: "x",
                helper: function(evt, ui) {
                    var $target = $(evt.target),
                        indx = parseInt($target.attr("pq-col-indx"));
                    self._setDragLimits(indx);
                    self._getDragHelper(evt, ui);
                    return $target
                },
                start: function(evt, ui) {
                    drag_left = evt.clientX;
                    cl_left = parseInt(self.$cl[0].style.left)
                },
                drag: function(evt, ui) {
                    drag_new_left = evt.clientX;
                    var dx = drag_new_left - drag_left;
                    self.$cl[0].style.left = cl_left + dx + "px"
                },
                stop: function(evt, ui) {
                    return self.resizeStop(evt, ui, drag_left)
                }
            })
        },
        _getDragHelper: function(evt) {
            var that = this.that,
                o = that.options,
                freezeCols = o.freezeCols * 1,
                $target = $(evt.target),
                $grid_center = that.$grid_center,
                iR = that.iRenderHead,
                ci = $target.attr("pq-col-indx") * 1,
                scrollX = ci < freezeCols ? 0 : iR.scrollX(),
                ht = $grid_center.outerHeight(),
                left = iR.getLeft(ci) - scrollX,
                left2 = iR.getLeft(ci + 1) - scrollX,
                style = "style='height:" + ht + "px;left:";
            this.$clleft = $("<div class='pq-grid-drag-bar' " + style + left + "px;'></div>").appendTo($grid_center);
            this.$cl = $("<div class='pq-grid-drag-bar' " + style + left2 + "px;'></div>").appendTo($grid_center)
        },
        _setDragLimits: function(ci) {
            if (ci < 0) {
                return
            }
            var that = this.that,
                iR = that.iRenderHead,
                CM = that.colModel,
                column = CM[ci],
                cont_left = iR.getLeft(ci) + column._minWidth,
                cont_right = cont_left + column._maxWidth - column._minWidth,
                $drag = $(iR._resizeDiv(ci));
            if ($drag.draggable("instance")) {
                $drag.draggable("option", "containment", [cont_left, 0, cont_right, 0])
            }
        },
        resizeStop: function(evt, ui, drag_left) {
            var that = this.that,
                CM = that.colModel,
                thisOptions = that.options,
                self = this,
                numberCell = thisOptions.numberCell;
            self.$clleft.remove();
            self.$cl.remove();
            var drag_new_left = evt.clientX,
                dx = drag_new_left - drag_left,
                $target = $(ui.helper),
                colIndx = $target.attr("pq-col-indx") * 1,
                column;
            if (colIndx === -1) {
                column = null;
                var oldWidth = parseInt(numberCell.width),
                    newWidth = oldWidth + dx;
                numberCell.width = newWidth
            } else {
                column = CM[colIndx];
                var oldWidth = parseInt(column.width),
                    newWidth = oldWidth + dx;
                column.width = newWidth;
                column._resized = true
            }
            that._trigger("columnResize", evt, {
                colIndx: colIndx,
                column: column,
                dataIndx: column ? column.dataIndx : null,
                oldWidth: oldWidth,
                newWidth: column ? column.width : numberCell.width
            });
            that.refresh({
                soft: true
            })
        }
    };
    _pq.cDragColumns = function(that) {
        var self = this;
        self.that = that;
        self.$drag_helper = null;
        var dragColumns = that.options.dragColumns,
            topIcon = dragColumns.topIcon,
            bottomIcon = dragColumns.bottomIcon;
        self.status = "stop";
        self.$arrowTop = $("<div class='pq-arrow-down ui-icon " + topIcon + "'></div>").appendTo(that.element);
        self.$arrowBottom = $("<div class='pq-arrow-up ui-icon " + bottomIcon + "' ></div>").appendTo(that.element);
        self.hideArrows();
        if (dragColumns && dragColumns.enabled) {
            that.$header.on("mousedown", ".pq-grid-col", self.onColMouseDown(self, that))
        }
    };
    _pq.cDragColumns.prototype = {
        onColMouseDown: function(self, that) {
            return function(evt) {
                var colobj, col, parent, e, $td = $(this);
                if (!evt.pq_composed) {
                    if ($(evt.target).is("input,select,textarea")) {
                        return
                    }
                    colobj = that.getHeadCell($td);
                    col = colobj.col;
                    parent = col ? col.parent : null;
                    if (!col || col.nodrag || col._nodrag || parent && parent.colSpan === 1) {
                        return
                    }
                    if (self.setDraggable(evt, col, colobj)) {
                        evt.pq_composed = true;
                        e = $.Event("mousedown", evt);
                        $(evt.target).trigger(e)
                    }
                }
            }
        },
        showFeedback: function($td, leftDrop) {
            var that = this.that,
                td = $td[0],
                offParent = td.offsetParent.offsetParent,
                grid_center_top = that.$grid_center[0].offsetTop,
                left = td.offsetLeft - offParent.offsetParent.scrollLeft + (!leftDrop ? td.offsetWidth : 0) - 8,
                top = grid_center_top + td.offsetTop - 16,
                top2 = grid_center_top + that.$header[0].offsetHeight;
            this.$arrowTop.css({
                left: left,
                top: top,
                display: ""
            });
            this.$arrowBottom.css({
                left: left,
                top: top2,
                display: ""
            })
        },
        showArrows: function() {
            this.$arrowTop.show();
            this.$arrowBottom.show()
        },
        hideArrows: function() {
            this.$arrowTop.hide();
            this.$arrowBottom.hide()
        },
        updateDragHelper: function(accept) {
            var that = this.that,
                dragColumns = that.options.dragColumns,
                acceptIcon = dragColumns.acceptIcon,
                rejectIcon = dragColumns.rejectIcon,
                $drag_helper = this.$drag_helper;
            if (!$drag_helper) {
                return
            }
            if (accept) {
                $drag_helper.children("span.pq-drag-icon").addClass(acceptIcon).removeClass(rejectIcon);
                $drag_helper.removeClass("ui-state-error")
            } else {
                $drag_helper.children("span.pq-drag-icon").removeClass(acceptIcon).addClass(rejectIcon);
                $drag_helper.addClass("ui-state-error")
            }
        },
        onStart: function(self, that, column, colobj) {
            return function(evt) {
                if (that._trigger("columnDrag", evt.originalEvent, {
                        column: column
                    }) === false) {
                    return false
                }
                self.setDroppables(colobj)
            }
        },
        onDrag: function(self, that) {
            return function(evt, ui) {
                self.status = "drag";
                var $td = $(".pq-drop-hover", that.$header);
                if ($td.length > 0) {
                    self.showArrows();
                    self.updateDragHelper(true);
                    var wd = $td.width();
                    var lft = evt.clientX - $td.offset().left + $(document).scrollLeft();
                    if (lft < wd / 2) {
                        self.leftDrop = true;
                        self.showFeedback($td, true)
                    } else {
                        self.leftDrop = false;
                        self.showFeedback($td, false)
                    }
                } else {
                    self.hideArrows();
                    var $group = $(".pq-drop-hover", that.$top);
                    if ($group.length) {
                        self.updateDragHelper(true)
                    } else {
                        self.updateDragHelper()
                    }
                }
            }
        },
        dragHelper: function(self, that, column) {
            var rejectIcon = that.options.dragColumns.rejectIcon;
            return function() {
                self.status = "helper";
                that.$header.find(".pq-grid-col-resize-handle").hide();
                var $drag_helper = $("<div class='pq-col-drag-helper ui-widget-content ui-corner-all panel panel-default' >" + "<span class='pq-drag-icon ui-icon " + rejectIcon + " glyphicon glyphicon-remove'></span>" + column.pq_title + "</div>");
                self.$drag_helper = $drag_helper;
                return $drag_helper[0]
            }
        },
        _columnIndexOf: function(colModel, column) {
            for (var i = 0, len = colModel.length; i < len; i++) {
                if (colModel[i] === column) {
                    return i
                }
            }
            return -1
        },
        setDraggable: function(evt, column, colobj) {
            var $td = $(evt.currentTarget),
                self = this,
                that = self.that;
            if (!$td.hasClass("ui-draggable")) {
                $td.draggable({
                    distance: 10,
                    cursorAt: {
                        top: -18,
                        left: -10
                    },
                    zIndex: "1000",
                    appendTo: that.element,
                    revert: "invalid",
                    helper: self.dragHelper(self, that, column),
                    start: self.onStart(self, that, column, colobj),
                    drag: self.onDrag(self, that),
                    stop: function() {
                        if (that.element) {
                            self.status = "stop";
                            that.$header.find(".pq-grid-col-resize-handle").show();
                            self.hideArrows()
                        }
                    }
                });
                return true
            }
        },
        setDroppables: function(colObj) {
            var self = this,
                that = self.that,
                col_o = colObj.col,
                ri_o = colObj.ri,
                ci_o1 = colObj.o_ci,
                ci_o2 = ci_o1 + col_o.o_colspan,
                obj, ri, ci, col, $td, td_isDroppable, i, onDrop = self.onDrop(),
                objDrop = {
                    hoverClass: "pq-drop-hover ui-state-highlight",
                    accept: ".pq-grid-col",
                    tolerance: "pointer",
                    drop: onDrop
                },
                $tds = that.$header.find(":not(.pq-grid-header-search-row)>.pq-grid-col");
            i = $tds.length;
            while (i--) {
                $td = $($tds[i]);
                td_isDroppable = $td.hasClass("ui-droppable");
                obj = that.getHeadCell($td);
                col = obj.col;
                ri = obj.ri;
                ci = obj.ci;
                if (col === col_o || col.nodrop || col._nodrop || ri_o < ri && ci >= ci_o1 && ci < ci_o2) {
                    if (td_isDroppable) {
                        $td.droppable("destroy")
                    }
                } else if (!td_isDroppable) {
                    $td.droppable(objDrop)
                }
            }
        },
        onDrop: function() {
            var self = this,
                that = this.that;
            return function(evt, ui) {
                if (self.dropPending) {
                    return
                }
                var colIndxDrag = ui.draggable.attr("pq-col-indx") * 1,
                    rowIndxDrag = ui.draggable.attr("pq-row-indx") * 1,
                    $this = $(this),
                    colIndxDrop = $this.attr("pq-col-indx") * 1,
                    rowIndxDrop = $this.attr("pq-row-indx") * 1,
                    left = self.leftDrop;
                if (that._trigger("beforeColumnOrder", null, {
                        colIndxDrag: colIndxDrag,
                        colIndxDrop: colIndxDrop,
                        left: left
                    }) === false) {
                    return
                }
                var column = self.moveColumn(colIndxDrag, colIndxDrop, left, rowIndxDrag, rowIndxDrop);
                self.dropPending = true;
                window.setTimeout(function() {
                    that.iCols.init();
                    var ret = that._trigger("columnOrder", null, {
                        dataIndx: column.dataIndx,
                        column: column,
                        oldcolIndx: colIndxDrag,
                        colIndx: that.getColIndx({
                            column: column
                        })
                    });
                    if (ret !== false) {
                        that.refresh()
                    }
                    self.dropPending = false
                })
            }
        },
        getRowIndx: function(hc, colIndx, lastRowIndx) {
            var column, column2;
            while (lastRowIndx) {
                column = hc[lastRowIndx][colIndx];
                column2 = hc[lastRowIndx - 1][colIndx];
                if (column !== column2) {
                    break
                }
                lastRowIndx--
            }
            return lastRowIndx
        },
        moveColumn: function(colIndxDrag, colIndxDrop, leftDrop, rowIndxDrag, rowIndxDrop) {
            var that = this.that,
                self = this,
                optCM = that.options.colModel,
                hc = that.headerCells,
                lastRowIndx = that.depth - 1,
                rowIndxDrag = rowIndxDrag === null ? self.getRowIndx(hc, colIndxDrag, lastRowIndx) : rowIndxDrag,
                rowIndxDrop = rowIndxDrop === null ? self.getRowIndx(hc, colIndxDrop, lastRowIndx) : rowIndxDrop,
                columnDrag = hc[rowIndxDrag][colIndxDrag],
                columnDrop = hc[rowIndxDrop][colIndxDrop],
                colModelDrag = rowIndxDrag ? hc[rowIndxDrag - 1][colIndxDrag].colModel : optCM,
                colModelDrop = rowIndxDrop ? hc[rowIndxDrop - 1][colIndxDrop].colModel : optCM;
            var indxDrag = self._columnIndexOf(colModelDrag, columnDrag),
                decr = leftDrop ? 1 : 0;
            var column = colModelDrag.splice(indxDrag, 1)[0],
                indxDrop = self._columnIndexOf(colModelDrop, columnDrop) + 1 - decr;
            colModelDrop.splice(indxDrop, 0, column);
            return column
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    _pq.cHeaderSearch = function(that) {};
    _pq.cHeaderSearch.prototype = {
        _bindFocus: function() {
            var that = this.that,
                self = this;

            function handleFocus(e) {
                var $target = $(e.target),
                    $inp = $target.closest(".pq-grid-hd-search-field"),
                    dataIndx = $inp.attr("name");
                if (that.scrollColumn({
                        dataIndx: dataIndx
                    })) {
                    var colIndx = that.getColIndx({
                        dataIndx: dataIndx
                    });
                    var $ele = self.get$Ele(colIndx, dataIndx);
                    $ele.focus()
                }
            }
            var $trs = that.$header.find(".pq-grid-header-search-row");
            for (var i = 0; i < $trs.length; i++) {
                $($trs[i]).on("focusin", handleFocus)
            }
        },
        _input: function(column, value, cls, style, attr, cond) {
            value = pq.formatEx(column, value, cond);
            return ["<input ", ' value="', value, "\" name='", column.dataIndx, "' type=text style='", style, "' class='", cls, "' ", attr, " />"].join("")
        },
        _onKeyDown: function(evt, ui, $this) {
            var self = this,
                that = this.that,
                $ele, keyCode = evt.keyCode,
                keyCodes = $.ui.keyCode;
            if (keyCode === keyCodes.TAB) {
                var colIndx = self.getCellIndx($this.closest(".pq-grid-col")[0])[1],
                    CM = that.colModel,
                    $inp, shiftKey = evt.shiftKey,
                    column = CM[colIndx];
                if ((column.filterUI || {}).type === "textbox2") {
                    that.scrollColumn({
                        colIndx: colIndx
                    });
                    $ele = self.getCellEd(colIndx)[1];
                    if ($ele[0] === $this[0]) {
                        if (!shiftKey) $inp = $ele[1]
                    } else {
                        if (shiftKey) $inp = $ele[0]
                    }
                    if ($inp) {
                        $inp.focus();
                        evt.preventDefault();
                        return false
                    }
                }
                do {
                    if (shiftKey) colIndx--;
                    else colIndx++;
                    if (colIndx < 0 || colIndx >= CM.length) {
                        break
                    }
                    var column = CM[colIndx],
                        cfilter = column.filter;
                    if (column.hidden || !cfilter) {
                        continue
                    }
                    that.scrollColumn({
                        colIndx: colIndx
                    }, function() {
                        var $inp = self.getCellEd(colIndx)[1];
                        if ((column.filterUI || {}).type === "textbox2") {
                            $inp = $(shiftKey ? $inp[1] : $inp[0])
                        }
                        if ($inp) {
                            $inp.focus();
                            evt.preventDefault();
                            return false
                        }
                    });
                    break
                } while (1 === 1)
            } else {
                return true
            }
        },
        _textarea: function(dataIndx, value, cls, style, attr) {
            return ["<textarea name='", dataIndx, "' style='" + style + "' class='" + cls + "' " + attr + " >", value, "</textarea>"].join("")
        },
        bindListener: function($ele, event, handler, column) {
            var self = this,
                that = self.that,
                filter = column.filter,
                arr = pq.filter.getVal(filter),
                oval = arr[0],
                oval2 = arr[1];
            pq.fakeEvent($ele, event, that.options.filterModel.timeout);
            $ele.off(event).on(event, function(evt) {
                var value, value2, filterUI = column.filterUI,
                    type = filterUI.type,
                    condition = filterUI.condition;
                if (type === "checkbox") {
                    value = $ele.pqval({
                        incr: true
                    })
                } else if (type === "textbox2") {
                    value = $($ele[0]).val();
                    value2 = $($ele[1]).val()
                } else {
                    value = $ele.val()
                }
                value = value === "" ? undefined : pq.deFormat(column, value, condition);
                value2 = value2 === "" ? undefined : pq.deFormat(column, value2, condition);
                if (oval !== value || oval2 !== value2) {
                    oval = value;
                    oval2 = value2;
                    handler = pq.getFn(handler);
                    return handler.call(that, evt, {
                        column: column,
                        dataIndx: column.dataIndx,
                        value: value,
                        value2: value2
                    })
                }
            })
        },
        betweenTmpl: function(input1, input2) {
            var strS = ["<div class='pq-from-div'>", input1, "</div>", "<span class='pq-from-to-center'>-</span>", "<div class='pq-to-div'>", input2, "</div>"].join("");
            return strS
        },
        createListener: function(type) {
            var obj = {},
                that = this.that;
            obj[type] = function(evt, ui) {
                var col = ui.column;
                that.filter({
                    rules: [{
                        dataIndx: col.filterIndx || ui.dataIndx,
                        condition: col.filter.condition,
                        value: ui.value,
                        value2: ui.value2
                    }]
                })
            };
            return obj
        },
        getCellEd: function(ci) {
            var self = this,
                ri = self.data.length - 1,
                $cell = $(this.getCell(ri, ci)),
                $editor = $cell.find(".pq-grid-hd-search-field");
            return [$cell, $editor]
        },
        onCreateHeader: function() {
            var self = this,
                col;
            if (self.that.options.filterModel.header) {
                self.eachH(function(column) {
                    if (column.filter) {
                        self.postRenderCell(column)
                    }
                })
            }
        },
        onHeaderKeyDown: function(evt, ui) {
            var $src = $(evt.originalEvent.target);
            if ($src.hasClass("pq-grid-hd-search-field")) {
                return this._onKeyDown(evt, ui, $src)
            } else {
                return true
            }
        },
        postRenderCell: function(column) {
            var dataIndx = column.dataIndx,
                filterUI = column.filterUI || {},
                filter = column.filter,
                self = this,
                that = self.that,
                ci = that.colIndxs[dataIndx],
                arr = this.getCellEd(ci),
                $cell = arr[0],
                $editor = arr[1];
            if ($editor.length === 0) {
                return
            }
            var ftype = filterUI.type,
                events = {
                    button: "click",
                    select: "change",
                    checkbox: "change",
                    textbox: "timeout",
                    textbox2: "timeout"
                },
                value = pq.filter.getVal(filter)[0];
            if (ftype === "checkbox") {
                $editor.pqval({
                    val: value
                })
            } else if (ftype === "select") {
                value = value || [];
                if (!$.isArray(value)) {
                    value = [value]
                }
                if (column.format) {
                    value = value.slice(0, 25).map(function(val) {
                        return pq.format(column, val)
                    })
                }
                $editor.val(value.join(", "))
            }
            var finit = filterUI.init,
                flistener = filter.listener,
                listeners = filter.listeners || [flistener ? flistener : events[ftype]];
            if (finit) {
                finit.find(function(i) {
                    return that.callFn(i, {
                        dataIndx: dataIndx,
                        column: column,
                        filter: filter,
                        filterUI: filterUI,
                        $cell: $cell,
                        $editor: $editor
                    })
                })
            }
            for (var j = 0; j < listeners.length; j++) {
                var listener = listeners[j],
                    typeL = typeof listener,
                    obj = {};
                if (typeL === "string") {
                    listener = self.createListener(listener)
                } else if (typeL === "function") {
                    obj[events[ftype]] = listener;
                    listener = obj
                }
                for (var event in listener) {
                    self.bindListener($editor, event, listener[event], column)
                }
            }
        },
        getControlStr: function(column) {
            var that = this.that,
                dataIndx = column.dataIndx,
                filter = column.filter,
                corner_cls = " ui-corner-all",
                varr = pq.filter.getVal(filter),
                value = varr[0],
                value2 = varr[1],
                condition = varr[2],
                ui = {
                    column: column,
                    dataIndx: dataIndx,
                    condition: condition,
                    indx: 0
                },
                filterUI = column.filterUI = pq.filter.getFilterUI(ui, that),
                type = filterUI.type,
                strS = "";
            if (type === "textbox2") {
                value2 = value2 !== null ? value2 : ""
            }
            var cls = "pq-grid-hd-search-field " + (filterUI.cls || ""),
                style = filterUI.style || "",
                attr = filterUI.attr || "";
            if (type && type.indexOf("textbox") >= 0) {
                value = value ? value : "";
                cls = cls + " pq-search-txt" + corner_cls;
                if (type === "textbox2") {
                    strS = this.betweenTmpl(this._input(column, value, cls + " pq-from", style, attr, condition), this._input(column, value2, cls + " pq-to", style, attr, condition))
                } else {
                    strS = this._input(column, value, cls, style, attr, condition)
                }
            } else if (type === "select") {
                cls = cls + corner_cls;
                var attrSelect = ["name='", dataIndx, "' class='", cls, "' style='", style, "' ", attr].join("");
                strS = "<input type='text' " + attrSelect + " >" + "<span style='position:absolute;right:0;top:3px;' class='ui-icon ui-icon-arrowthick-1-s'></span>"
            } else if (type === "checkbox") {
                var checked = value === null || value === false ? "" : "checked=checked";
                strS = ["<input ", checked, " name='", dataIndx, "' type=checkbox class='" + cls + "' style='" + style + "' " + attr + "/>"].join("")
            } else if (typeof type === "string") {
                strS = type
            }
            return strS
        },
        renderFilterCell: function(column, ci, td_cls) {
            var self = this,
                td, that = self.that,
                o = that.options,
                FM = o.filterModel,
                hasMenu, ccls = column.cls,
                strS, align = column.halign || column.align;
            align && td_cls.push("pq-align-" + align);
            ccls && td_cls.push(ccls);
            td_cls.push(column.clsHead);
            if (column.filter) {
                strS = self.getControlStr(column);
                if (strS) {
                    td_cls.push("pq-col-" + ci)
                }
            }
            hasMenu = self.hasMenu(FM, column);
            if (hasMenu) td_cls.push("pq-has-menu");
            td = ["<div class='pq-td-div' style='overflow:hidden;'>", "", strS, "</div>", hasMenu ? "<span class='pq-filter-icon'></span>" : ""].join("");
            return td
        },
        hasMenu: function(FM, col) {
            var FM_menu = FM.menuIcon,
                filter_menu = (col.filter || {}).menuIcon;
            return FM_menu && filter_menu !== false || FM_menu !== false && filter_menu
        }
    }
})(jQuery);
(function($) {
    var cRefresh = $.paramquery.cRefresh = function(that) {
        var self = this;
        self.vrows = [];
        self.that = that;
        that.on("dataReadyDone", function() {
            self.addRowIndx(true)
        });
        $(window).on("resize" + that.eventNamespace + " " + "orientationchange" + that.eventNamespace, self.onWindowResize.bind(self))
    };
    $.extend(cRefresh, {
        Z: function() {
            return (window.outerWidth - 8) / window.innerWidth
        },
        cssZ: function() {
            return document.body.style.zoom
        },
        isFullScreen: function() {
            return document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen || window.innerHeight === screen.height
        },
        isSB: function() {
            return $(document).height() > $(window).height()
        }
    });
    $(function() {
        var z = cRefresh.Z,
            cssZ = cRefresh.cssZ,
            z1 = z(),
            cssZ1 = cssZ();
        cRefresh.isZoom = function() {
            var z2 = z(),
                cssZ2 = cssZ();
            if (z1 !== z2 || cssZ1 !== cssZ2) {
                z1 = z2;
                cssZ1 = cssZ2;
                return true
            }
        };
        var isSB = cRefresh.isSB,
            sb = isSB();
        $.paramquery.onResize(document.body, function() {
            var nsb = isSB();
            if (nsb !== sb) {
                sb = nsb;
                $(window).trigger("resize", {
                    SB: true
                })
            }
        })
    });
    $(window).on("resize", function() {
        if (cRefresh.isZoom) cRefresh.ISZOOM = cRefresh.isZoom()
    });
    cRefresh.prototype = {
        addRowIndx: function(UF) {
            var that = this.that,
                DM = that.options.dataModel,
                dataUF = DM.dataUF,
                data = that.get_p_data(),
                i = data.length,
                rd;
            while (i--) {
                rd = data[i];
                rd && (rd.pq_ri = i)
            }
            if (UF) {
                i = dataUF.length;
                while (i--) {
                    delete dataUF[i].pq_ri
                }
            }
        },
        setGridAndCenterHeightForFlex: function() {
            var that = this.that;
            that.element.height("");
            that.$grid_center.height("");
            that.dims.htGrid = that.element.height()
        },
        setGridWidthForFlex: function() {
            var that = this.that,
                o = that.options,
                maxWidthPixel = this.maxWidthPixel,
                $grid = that.element,
                toolWd = that.$toolPanel[0].offsetWidth,
                contWd = that.iRenderB.getFlexWidth(),
                gridWd = toolWd + contWd;
            if (o.maxWidth && gridWd >= this.maxWidthPixel) {
                gridWd = maxWidthPixel
            }
            that._trigger("contWd");
            $grid.width(gridWd + "px");
            that.dims.wdGrid = gridWd
        },
        _calcOffset: function(val) {
            var re = /(-|\+)([0-9]+)/;
            var match = re.exec(val);
            if (match && match.length === 3) {
                return parseInt(match[1] + match[2])
            } else {
                return 0
            }
        },
        setMax: function(prop) {
            var that = this.that,
                $grid = that.element,
                o = that.options,
                val = o[prop];
            if (val) {
                if (val === parseInt(val)) {
                    val += "px"
                }
                $grid.css(prop, val)
            } else {
                $grid.css(prop, "")
            }
        },
        refreshGridWidthAndHeight: function() {
            var that = this.that,
                o = that.options,
                wd, ht, dims = that.dims,
                widthPercent = (o.width + "").indexOf("%") > -1 ? true : false,
                heightPercent = (o.height + "").indexOf("%") > -1 ? true : false,
                maxHeightPercent = (o.maxHeight + "").indexOf("%") > -1 ? true : false,
                flexHeight = o.height === "flex",
                maxHeightPercentAndFlexHeight = maxHeightPercent && flexHeight,
                maxWidthPercent = (o.maxWidth + "").indexOf("%") > -1 ? true : false,
                flexWidth = o.width === "flex",
                maxWidthPercentAndFlexWidth = maxWidthPercent && flexWidth,
                element = that.element;
            if (widthPercent || heightPercent || maxHeightPercentAndFlexHeight || maxWidthPercentAndFlexWidth) {
                var parent = element.parent();
                if (!parent.length) {
                    return
                }
                var wdParent, htParent;
                if (parent[0] === document.body || element.css("position") === "fixed") {
                    wdParent = $(window).width();
                    htParent = window.innerHeight || $(window).height()
                } else {
                    wdParent = parent.width();
                    htParent = parent.height()
                }
                var superParent = null,
                    calcOffset = this._calcOffset,
                    widthOffset = widthPercent ? calcOffset(o.width) : 0,
                    heightOffset = heightPercent ? calcOffset(o.height) : 0;
                if (maxWidthPercentAndFlexWidth) {
                    wd = parseInt(o.maxWidth) * wdParent / 100
                } else if (widthPercent) {
                    wd = parseInt(o.width) * wdParent / 100 + widthOffset
                }
                if (maxHeightPercentAndFlexHeight) {
                    ht = parseInt(o.maxHeight) * htParent / 100
                } else if (heightPercent) {
                    ht = parseInt(o.height) * htParent / 100 + heightOffset
                }
            }
            if (!wd) {
                if (flexWidth && o.maxWidth) {
                    if (!maxWidthPercent) {
                        wd = o.maxWidth
                    }
                } else if (!widthPercent) {
                    wd = o.width
                }
            }
            if (o.maxWidth) {
                this.maxWidthPixel = wd
            }
            if (!ht) {
                if (flexHeight && o.maxHeight) {
                    if (!maxHeightPercent) {
                        ht = o.maxHeight
                    }
                } else if (!heightPercent) {
                    ht = o.height
                }
            }
            if (parseFloat(wd) === wd) {
                wd = wd < o.minWidth ? o.minWidth : wd;
                element.css("width", wd)
            } else if (wd === "auto") {
                element.width(wd)
            }
            if (parseFloat(ht) === ht) {
                ht = ht < o.minHeight ? o.minHeight : ht;
                element.css("height", ht)
            }
            dims.wdGrid = Math.round(element.width());
            dims.htGrid = Math.round(element.height())
        },
        isReactiveDims: function() {
            var that = this.that,
                o = that.options,
                wd = o.width,
                ht = o.height,
                maxWd = o.maxWidth,
                maxHt = o.maxHeight,
                isPercent = function(val) {
                    return (val + "").indexOf("%") !== -1 ? true : false
                },
                widthPercent = isPercent(wd),
                autoWidth = wd === "auto",
                heightPercent = isPercent(ht),
                maxWdPercent = isPercent(maxWd),
                maxHtPercent = isPercent(maxHt);
            return widthPercent || autoWidth || heightPercent || maxWdPercent || maxHtPercent
        },
        getParentDims: function() {
            var that = this.that,
                $grid = that.element,
                wd, ht, $parent = $grid.parent();
            if ($parent.length) {
                if ($parent[0] === document.body || $grid.css("position") === "fixed") {
                    ht = window.innerHeight || $(window).height();
                    wd = $(window).width()
                } else {
                    ht = $parent.height();
                    wd = $parent.width()
                }
                return [wd, ht]
            }
            return []
        },
        onWindowResize: function(evt, ui) {
            var self = this,
                that = self.that,
                dims = that.dims || {},
                htParent = dims.htParent,
                wdParent = dims.wdParent,
                o = that.options,
                $grid = that.element,
                newHtParent, newWdParent, arr, isReactiveDims, ui_grid;
            if (cRefresh.isFullScreen()) {
                return
            }
            if ($.support.touch && o.editModel.indices && $(document.activeElement).is(".pq-editor-focus")) {
                return
            }
            if (ui) {
                ui_grid = ui.$grid;
                if (ui_grid) {
                    if (ui_grid === $grid || $grid.closest(ui_grid).length === 0) {
                        return
                    }
                }
            }
            isReactiveDims = self.isReactiveDims();
            if (cRefresh.ISZOOM) {
                return self.setResizeTimer(function() {
                    self.refresh({
                        soft: true
                    })
                })
            }
            if (isReactiveDims) self.setResizeTimer(function() {
                arr = self.getParentDims(), newWdParent = arr[0], newHtParent = arr[1];
                if (newHtParent === htParent && newWdParent === wdParent) {
                    if (parseInt($grid.width()) === parseInt(dims.wdGrid)) {
                        return
                    }
                } else {
                    dims.htParent = newHtParent;
                    dims.wdParent = newWdParent
                }
                self.refresh({
                    soft: true
                })
            })
        },
        setResizeTimer: function(fn) {
            var self = this,
                that = self.that;
            clearTimeout(self._autoResizeTimeout);
            self._autoResizeTimeout = window.setTimeout(function() {
                if (that.element) fn ? fn() : self.refreshAfterResize()
            }, that.options.autoSizeInterval || 100)
        },
        refresh: function(ui) {
            ui = ui || {};
            var self = this,
                that = self.that,
                header = ui.header === null ? true : ui.header,
                pager = ui.pager,
                o, normal = !ui.soft,
                $grid = that.element,
                $tp = that.$toolPanel,
                dims = that.dims = that.dims || {
                    htCenter: 0,
                    htHead: 0,
                    htSum: 0,
                    htBody: 0,
                    wdCenter: 0,
                    htTblSum: 0
                };
            if (ui.colModel) {
                that.refreshCM()
            }
            if (!$grid[0].offsetWidth) {
                $grid.addClass("pq-pending-refresh");
                return
            }
            $tp.css("height", "1px");
            if (ui.toolbar) {
                that.refreshToolbar()
            }
            o = that.options;
            o.collapsible._collapsed = false;
            self.setMax("maxHeight");
            self.setMax("maxWidth");
            self.refreshGridWidthAndHeight();
            if (normal && pager !== false) {
                that._refreshPager()
            }
            dims.htCenter = self.setCenterHeight();
            dims.wdCenter = dims.wdGrid - $tp[0].offsetWidth;
            that.iRenderB.init({
                header: header,
                soft: ui.soft,
                source: ui.source
            });
            o.height === "flex" && self.setGridAndCenterHeightForFlex();
            o.width === "flex" && self.setGridWidthForFlex();
            var arr = this.getParentDims();
            dims.wdParent = arr[0];
            dims.htParent = arr[1];
            normal && that._createCollapse();
            o.dataModel.postDataOnce = undefined;
            that._trigger("refreshFull")
        },
        setCenterHeight: function() {
            var that = this.that,
                $top = that.$top,
                o = that.options,
                ht;
            if (o.height !== "flex" || o.maxHeight) {
                ht = that.dims.htGrid - (o.showTop ? $top[0].offsetHeight + parseInt($top.css("marginTop")) : 0) - that.$bottom[0].offsetHeight + 1;
                ht = ht >= 0 ? ht : "";
                that.$grid_center.height(ht)
            }
            return ht
        }
    };
    $(function() {})
})(jQuery);
(function($) {
    var cCheckBoxColumn = $.paramquery.cCheckBoxColumn = function(that, column) {
        var self = this,
            colCB, colUI;
        self.that = that;
        self.options = that.options;
        if (column.cbId) {
            colUI = self.colUI = column;
            colCB = self.colCB = that.columns[column.cbId]
        } else {
            colCB = colUI = self.colCB = self.colUI = column
        }
        var defObj = {
                all: false,
                header: false,
                select: false,
                check: true,
                uncheck: false
            },
            cb = colCB.cb = $.extend({}, defObj, colCB.cb),
            diCB = colCB.dataIndx;
        colUI._render = self.cellRender(colCB, colUI);
        that.on("dataAvailable", function() {
            that.one("dataReady", function() {
                return self.oneDataReady()
            })
        }).on("dataReady", self.onDataReady.bind(self)).on("valChange", self.onCheckBoxChange(self)).on("cellKeyDown", self.onCellKeyDown.bind(self)).on("refreshHeader", self.onRefreshHeader.bind(self)).on("change", self.onChange(self, that, diCB, cb.check, cb.uncheck));
        if (cb.select) {
            that.on("rowSelect", self.onRowSelect(self, that)).on("beforeRowSelectDone", self.onBeforeRowSelect(self, that, diCB, cb.check, cb.uncheck))
        }
        that.on("beforeCheck", self.onBeforeCheck.bind(self))
    };
    cCheckBoxColumn.prototype = $.extend({
        cellRender: function(colCB, colUI) {
            var self = this;
            return function(ui) {
                var grid = this,
                    rd = ui.rowData,
                    checked, disabled, diCB = colCB.dataIndx,
                    cb = colCB.cb,
                    renderLabel = colUI.renderLabel,
                    useLabel = colUI.useLabel,
                    text;
                if (rd.pq_gtitle || rd.pq_gsummary || ui.Export) {
                    return
                }
                checked = cb.check === rd[diCB] ? "checked" : "";
                disabled = self.isEditable(rd, colCB, ui.rowIndx, ui.colIndx, diCB) ? "" : "disabled";
                if (renderLabel) {
                    text = renderLabel.call(grid, ui)
                }
                if (text === null) {
                    text = colCB === colUI ? "" : ui.formatVal || ui.cellData
                }
                return [useLabel ? " <label style='width:100%;'>" : "", "<input type='checkbox' ", checked, " ", disabled, " />", text, useLabel ? "</label>" : ""].join("")
            }
        },
        checkAll: function(check, evt) {
            check = check === null ? true : check;
            var that = this.that,
                cbAll = this.colCB.cb.all,
                data = cbAll ? that.options.dataModel.data : that.pdata;
            return this.checkNodes(data, check, evt)
        },
        checkNodes: function(nodes, check, evt) {
            if (!nodes.length) {
                return
            }
            if (check === null) check = true;
            var self = this,
                that = self.that,
                diUI = self.colUI.dataIndx,
                colCB = self.colCB,
                cb = colCB.cb,
                newVal = check ? cb.check : cb.uncheck,
                diCB = colCB.dataIndx,
                node0 = nodes[0],
                ri0 = node0.pq_ri,
                refreshCell = function() {
                    that.refreshCell({
                        rowIndx: ri0,
                        dataIndx: diUI
                    });
                    return false
                },
                rowList = nodes.map(function(rd) {
                    var oldRow = {},
                        newRow = {};
                    oldRow[diCB] = rd[diCB];
                    newRow[diCB] = newVal;
                    return {
                        rowIndx: rd.pq_ri,
                        rowData: rd,
                        oldRow: oldRow,
                        newRow: newRow
                    }
                }),
                ui = {
                    rowIndx: ri0,
                    rowData: node0,
                    dataIndx: diUI,
                    check: check,
                    rows: rowList
                },
                dui = {
                    source: "checkbox"
                };
            if (that._trigger("beforeCheck", evt, ui) === false) {
                return refreshCell()
            }
            dui.updateList = ui.rows;
            dui.history = dui.track = cb.select ? false : null;
            if (that._digestData(dui) === false) {
                return refreshCell()
            }
            if (!cb.maxCheck && dui.updateList.length === 1) that.refreshRow({
                rowIndx: ri0
            });
            else that.refresh({
                header: false
            })
        },
        isEditable: function(rd, col, ri, ci, di) {
            var that = this.that,
                ui = {
                    rowIndx: ri,
                    rowData: rd,
                    column: col,
                    colIndx: ci,
                    dataIndx: di
                };
            return that.isEditable(ui)
        },
        onBeforeRowSelect: function(self, that, cb_di, cb_check, cb_uncheck) {
            return function(evt, ui) {
                if (ui.source !== "checkbox") {
                    var fn = function(rows) {
                        var ri, rd, row, i = rows.length,
                            col = that.columns[cb_di],
                            ci = that.colIndxs[cb_di];
                        while (i--) {
                            row = rows[i];
                            ri = row.rowIndx;
                            rd = row.rowData;
                            if (self.isEditable(rd, col, ri, ci, cb_di)) {
                                rd[cb_di] = rd.pq_rowselect ? cb_uncheck : cb_check
                            } else {
                                rows.splice(i, 1)
                            }
                        }
                    };
                    fn(ui.addList);
                    fn(ui.deleteList)
                }
            }
        },
        onCellKeyDown: function(evt, ui) {
            if (ui.dataIndx === this.colUI.dataIndx) {
                if (evt.keyCode === 13 || evt.keyCode === 32) {
                    var $inp = $(evt.originalEvent.target).find("input");
                    $inp.click();
                    return false
                }
            }
        },
        onChange: function(self, that, diCB, check, uncheck) {
            return function(evt, ui) {
                var addList = [],
                    deleteList = [],
                    diUI = self.colUI.dataIndx,
                    trigger = function(list, check) {
                        if (list.length) that._trigger("check", evt, {
                            rows: list,
                            dataIndx: diUI,
                            rowIndx: list[0].rowIndx,
                            rowData: list[0].rowData,
                            check: check
                        })
                    },
                    fn = function(rlist) {
                        rlist.forEach(function(list) {
                            var newRow = list.newRow,
                                oldRow = list.oldRow,
                                val;
                            if (newRow.hasOwnProperty(diCB)) {
                                val = newRow[diCB];
                                if (val === check) {
                                    addList.push(list)
                                } else if (oldRow && oldRow[diCB] === check) {
                                    deleteList.push(list);
                                }
                            }
                        })
                    };
                self.setValCBox();
                fn(ui.addList);
                fn(ui.updateList);
                if (self.colCB.cb.select) {
                    that.SelectRow().update({
                        addList: addList,
                        deleteList: deleteList,
                        source: "checkbox"
                    })
                }
                trigger(addList, true);
                trigger(deleteList, false)
            }
        },
        onCheckBoxChange: function(self) {
            return function(_evt, ui) {
                if (ui.dataIndx === self.colUI.dataIndx) {
                    return self.checkNodes([ui.rowData], ui.input.checked, _evt)
                }
            }
        },
        onDataReady: function() {
            this.setValCBox()
        },
        oneDataReady: function() {
            var that = this.that,
                rowData, data = that.get_p_data(),
                i = 0,
                len = data.length,
                column = this.colCB,
                cb = column.cb,
                dataIndx = column.dataIndx;
            if (dataIndx !== null && data) {
                if (cb.select) {
                    for (; i < len; i++) {
                        if (rowData = data[i]) {
                            if (rowData[dataIndx] === cb.check) {
                                rowData.pq_rowselect = true
                            } else if (rowData.pq_rowselect) {
                                rowData[dataIndx] = cb.check
                            }
                        }
                    }
                }
            }
        },
        onRowSelect: function(self, that) {
            return function(evt, ui) {
                if (ui.source !== "checkbox") {
                    if (ui.addList.length || ui.deleteList.length) {
                        self.setValCBox();
                        that.refresh({
                            header: false
                        })
                    }
                }
            }
        }
    }, pq.mixin.ChkGrpTree)
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    var fni = {};
    fni.options = {
        stateColKeys: {
            width: 1,
            filter: ["crules", "mode"],
            hidden: 1
        },
        stateKeys: {
            height: 1,
            width: 1,
            freezeRows: 1,
            freezeCols: 1,
            groupModel: ["dataIndx", "collapsed", "grandSummary"],
            pageModel: ["curPage", "rPP"],
            sortModel: ["sorter"]
        },
        detailModel: {
            cache: true,
            offset: 100,
            expandIcon: "ui-icon-triangle-1-se glyphicon glyphicon-minus",
            collapseIcon: "ui-icon-triangle-1-e glyphicon glyphicon-plus",
            height: 180
        },
        dragColumns: {
            enabled: true,
            acceptIcon: "ui-icon-check glyphicon-ok",
            rejectIcon: "ui-icon-closethick glyphicon-remove",
            topIcon: "ui-icon-circle-arrow-s glyphicon glyphicon-circle-arrow-down",
            bottomIcon: "ui-icon-circle-arrow-n glyphicon glyphicon-circle-arrow-up"
        },
        flex: {
            on: true,
            one: false,
            all: true
        },
        track: null,
        mergeModel: {
            flex: false
        },
        realFocus: true,
        sortModel: {
            on: true,
            type: "local",
            multiKey: "shiftKey",
            number: true,
            single: true,
            cancel: true,
            sorter: [],
            useCache: true,
            ignoreCase: false
        },
        filterModel: {
            on: true,
            newDI: [],
            type: "local",
            mode: "AND",
            header: false,
            timeout: 400
        }
    };
    fni._create = function() {
        var that = this,
            o = that.options;
        that.listeners = {};
        that._queueATriggers = {};
        that.iHistory = new _pq.cHistory(that);
        that.iGroup = new _pq.cGroup(that);
        that.iMerge = new _pq.cMerge(that);
        that.iFilterData = new _pq.cFilterData(that);
        that.iSelection = new pq.Selection(that);
        that.iHeaderSearch = new _pq.cHeaderSearch(that);
        that.iUCData = new _pq.cUCData(that);
        that.iMouseSelection = new _pq.cMouseSelection(that);
        that._super();
        new _pq.cFormula(that);
        that.iDragColumns = new _pq.cDragColumns(that);
        that.refreshToolbar();
        if (o.dataModel.location === "remote") {
            that.refresh()
        }
        that.on("dataAvailable", function() {
            that.one("refreshDone", function() {
                that._trigger("ready");
                setTimeout(function() {
                    if (that.element) {
                        that._trigger("complete")
                    }
                }, 0)
            })
        });
        that.refreshDataAndView({
            header: true
        })
    };
    $.widget("paramquery.pqGrid", _pq._pqGrid, fni);
    $.widget.extend = function() {
        var arr_shift = Array.prototype.shift,
            isPlainObject = $.isPlainObject,
            isArray = $.isArray,
            w_extend = $.widget.extend,
            target = arr_shift.apply(arguments),
            deep, _deep;
        if (typeof target === "boolean") {
            deep = target;
            target = arr_shift.apply(arguments)
        }
        var inputs = arguments,
            i = 0,
            len = inputs.length,
            input, key, val;
        if (deep === null) {
            deep = len > 1 ? true : false
        }
        for (; i < len; i++) {
            input = inputs[i];
            for (key in input) {
                val = input[key];
                if (val !== undefined) {
                    _deep = i > 0 ? false : true;
                    if (isPlainObject(val)) {
                        target[key] = target[key] || {};
                        w_extend(_deep, target[key], val)
                    } else if (isArray(val)) {
                        target[key] = deep && _deep ? val.slice() : val
                    } else {
                        target[key] = val
                    }
                }
            }
        }
        return target
    };
    var pq = window.pq = window.pq || {};
    pq.grid = function(selector, options) {
        var $g = $(selector).pqGrid(options),
            g = $g.data("paramqueryPqGrid") || $g.data("paramquery-pqGrid");
        return g
    };
    pq.grid.render = {};
    _pq.pqGrid.regional = {};
    var fn = _pq.pqGrid.prototype;
    _pq.pqGrid.defaults = fn.options;
    fn.focus = function(_ui) {
        var ui = _ui || {},
            that = this,
            o = that.options,
            $td = ui.$td,
            td, ae = document.activeElement,
            fe, objC, nofocus, $cont = that.$cont,
            cont = $cont[0],
            data, rip = ui.rowIndxPage,
            ri, iM, cord, ci = ui.colIndx;
        if ($td) {
            if (rip === null || ci === null) {
                objC = this.getCellIndices({
                    $td: $td
                });
                rip = objC.rowIndxPage;
                ci = objC.colIndx
            }
        } else {
            if (rip === null || ci === null) {
                fe = this._focusEle;
                if (ae && ae !== document.body && ae.id !== "pq-grid-excel" && ae.className !== "pq-body-outer") {
                    nofocus = true;
                    return
                }
                if (fe) {
                    rip = fe.rowIndxPage;
                    ci = fe.colIndx
                } else {
                    nofocus = true
                }
            }
            if (rip !== null) {
                iM = that.iMerge;
                ri = rip + that.riOffset;
                if (iM.ismergedCell(ri, ci)) {
                    cord = iM.getRootCellO(ri, ci);
                    rip = cord.rowIndxPage;
                    ci = cord.colIndx
                }
                $td = that.getCell({
                    rowIndxPage: rip,
                    colIndx: ci
                })
            }
        }
        if (rip === null || ci === null) {
            return
        }
        var realFocus = $td[0] && this.iRenderB.inViewport(rip, ci, $td[0]);
        if (realFocus) {
            if (ae !== document.body) $(ae).blur();
            $cont.find(".pq-focus").removeAttr("tabindex").removeClass("pq-focus");
            $cont.removeAttr("tabindex");
            fe = this._focusEle = this._focusEle || {};
            if ($td && (td = $td[0]) && $td.hasClass("pq-grid-cell") && !td.edited) {
                if (fe.$ele && fe.$ele.length) {
                    fe.$ele[0].removeAttribute("tabindex")
                }
                fe.$ele = $td;
                fe.rowIndxPage = rip;
                fe.colIndx = ci;
                td.setAttribute("tabindex", "-1");
                if (!nofocus) {
                    $td.addClass("pq-focus");
                    td.focus()
                }
            } else {
                data = o.dataModel.data;
                if (!data || !data.length) {
                    cont.setAttribute("tabindex", 0)
                }
            }
        } else {
            fe = this._focusEle;
            if (fe) {
                $cont.find(".pq-focus").removeClass("pq-focus")
            }
            if ($td) {
                $td.addClass("pq-focus");
                this._focusEle = {
                    $ele: $td,
                    rowIndxPage: rip,
                    colIndx: ci
                }
            }
            if (document.activeElement !== cont) {
                $cont.attr("tabindex", 0);
                cont.focus()
            }
        }
    };
    fn.onfocus = function(evt) {
        var fe = this._focusEle;
        if (fe) {
            this.getCell(fe).addClass("pq-focus")
        }
    };
    fn.onblur = function() {
        var fe = this._focusEle;
        if (fe) {
            var rip = fe.rowIndxPage,
                ci = fe.colIndx,
                ae = document.activeElement;
            this.$cont.find(".pq-focus").removeClass("pq-focus");
            if (ae && ae !== document.body && ae.id !== "pq-grid-excel" && ae.className !== "pq-body-outer") {
                this._focusEle = {}
            }
        }
    };
    fn.callFn = function(cb, ui) {
        return pq.getFn(cb).call(this, ui)
    };
    fn.rowExpand = function(objP) {
        this.iHierarchy.rowExpand(objP)
    };
    fn.rowInvalidate = function(objP) {
        this.iHierarchy.rowInvalidate(objP)
    };
    fn.rowCollapse = function(objP) {
        this.iHierarchy.rowCollapse(objP)
    };
    fn._saveState = function(source, dest, stateKeys) {
        var key, model, oModel, obj;
        for (key in stateKeys) {
            model = stateKeys[key];
            if (model) {
                oModel = source[key];
                if ($.isArray(model)) {
                    if (oModel !== null) {
                        obj = dest[key] = $.isPlainObject(dest[key]) ? dest[key] : {};
                        model.forEach(function(prop) {
                            obj[prop] = oModel[prop]
                        })
                    }
                } else dest[key] = oModel
            }
        }
    };
    fn.saveState = function(ui) {
        ui = ui || {};
        var self = this,
            $grid = self.element,
            o = self.options,
            di, stateColKeys = o.stateColKeys,
            stateKeys = o.stateKeys,
            CM = self.colModel,
            sCM = [],
            column, sCol, i = 0,
            CMlen = CM.length,
            state, id = $grid[0].id;
        for (; i < CMlen; i++) {
            column = CM[i];
            di = column.dataIndx;
            sCol = {
                dataIndx: di
            };
            self._saveState(column, sCol, stateColKeys);
            sCM[i] = sCol
        }
        state = {
            colModel: sCM,
            datestamp: Date.now()
        };
        self._saveState(o, state, stateKeys);
        if (ui.stringify !== false) {
            state = JSON.stringify(state);
            if (ui.save !== false && typeof Storage !== "undefined") {
                localStorage.setItem("pq-grid" + (id || ""), state)
            }
        }
        return state
    };
    fn.getState = function() {
        if (typeof Storage !== "undefined") return localStorage.getItem("pq-grid" + (this.element[0].id || ""))
    };
    fn.loadState = function(ui) {
        ui = ui || {};
        var self = this,
            obj, wextend = $.widget.extend,
            state = ui.state || self.getState();
        if (!state) {
            return false
        } else if (typeof state === "string") {
            state = JSON.parse(state)
        }
        var CMstate = state.colModel,
            columnSt, columns = [],
            column, dataIndx, colOrder = [],
            o = self.options,
            stateColKeys = o.stateColKeys,
            isColGroup = self.depth > 1,
            oCM = isColGroup ? self.colModel : o.colModel;
        for (var i = 0, len = CMstate.length; i < len; i++) {
            columnSt = CMstate[i];
            dataIndx = columnSt.dataIndx;
            columns[dataIndx] = columnSt;
            colOrder[dataIndx] = i
        }
        if (!isColGroup) {
            oCM.sort(function(col1, col2) {
                return colOrder[col1.dataIndx] - colOrder[col2.dataIndx]
            })
        }
        for (i = 0, len = oCM.length; i < len; i++) {
            column = oCM[i];
            dataIndx = column.dataIndx;
            if (columnSt = columns[dataIndx]) {
                self._saveState(columnSt, column, stateColKeys)
            }
        }
        self.iCols.init();
        wextend(o.sortModel, state.sortModel);
        wextend(o.pageModel, state.pageModel);
        self.Group().option(state.groupModel, false);
        obj = {
            freezeRows: state.freezeRows,
            freezeCols: state.freezeCols
        };
        if (!isNaN(o.height * 1) && !isNaN(state.height * 1)) {
            obj.height = state.height
        }
        if (!isNaN(o.width * 1) && !isNaN(state.width * 1)) {
            obj.width = state.width
        }
        self.option(obj);
        if (ui.refresh !== false) {
            self.refreshDataAndView()
        }
        return true
    };
    fn.refreshToolbar = function() {
        var that = this,
            options = that.options,
            tb = options.toolbar,
            _toolbar;
        if (that._toolbar) {
            _toolbar = that._toolbar;
            _toolbar.destroy()
        }
        if (tb) {
            var cls = tb.cls,
                cls = cls ? cls : "",
                style = tb.style,
                style = style ? style : "",
                attr = tb.attr,
                attr = attr ? attr : "",
                items = tb.items,
                $toolbar = $("<div class='" + cls + "' style='" + style + "' " + attr + " ></div>");
            if (_toolbar) {
                _toolbar.widget().replaceWith($toolbar)
            } else {
                that.$top.append($toolbar)
            }
            _toolbar = pq.toolbar($toolbar, {
                items: items,
                gridInstance: that,
                bootstrap: options.bootstrap
            });
            if (!options.showToolbar) {
                $toolbar.css("display", "none")
            }
            that._toolbar = _toolbar
        }
    };
    fn.isLeftOrRight = function(colIndx) {
        var thisOptions = this.options,
            freezeCols = this.freezeCols;
        if (colIndx > freezeCols) {
            return "right"
        } else {
            return "left"
        }
    };
    fn.ovCreateHeader = function(buffer) {
        if (this.options.filterModel.header) {
            this.iHeaderSearch.createDOM(buffer)
        }
    };
    fn.filter = function(objP) {
        return this.iFilterData.filter(objP)
    };
    fn.Checkbox = function(di) {
        return this.iCheckBox[di]
    };
    fn._initTypeColumns = function() {
        var CM = this.colModel,
            i = 0,
            len = CM.length,
            iCB = this.iCheckBox = {};
        for (; i < len; i++) {
            var column = CM[i],
                type = column.type;
            if (type === "checkbox" || type === "checkBoxSelection") {
                column.type = "checkbox";
                iCB[column.dataIndx] = new _pq.cCheckBoxColumn(this, column)
            } else if (type === "detail") {
                column.dataIndx = "pq_detail";
                this.iHierarchy = new _pq.cHierarchy(this, column)
            }
        }
    };
    fn.refreshHeader = function() {
        this.iRenderHead.refreshHS()
    };
    fn.refreshHeaderFilter = function(ui) {
        var obj = this.normalize(ui),
            ci = obj.colIndx,
            column = obj.column,
            iH = this.iRenderHead,
            rowData = {},
            rip = iH.rows - 1;
        if (this.options.filterModel.header) {
            iH.refreshCell(rip, ci, rowData, column);
            iH.postRenderCell(column, ci, rip)
        }
    };
    fn._refreshHeaderSortIcons = function() {
        this.iHeader.refreshHeaderSortIcons()
    };
    fn.pageData = function() {
        return this.pdata
    };

    function _getData(data, dataIndices, arr) {
        for (var i = 0, len = data.length; i < len; i++) {
            var rowData = data[i],
                row = {},
                dataIndx, j = 0,
                dILen = dataIndices.length;
            for (; j < dILen; j++) {
                dataIndx = dataIndices[j];
                row[dataIndx] = rowData[dataIndx]
            }
            arr.push(row)
        }
    }
    fn.getData = function(ui) {
        ui = ui || {};
        var dataIndices = ui.dataIndx,
            dILen = dataIndices ? dataIndices.length : 0,
            data = ui.data,
            useCustomSort = !dILen,
            columns = this.columns,
            DM = this.options.dataModel,
            DMData = DM.dataPrimary || DM.data || [],
            DMDataUF = DM.dataUF || [],
            arr = [];
        if (dILen) {
            if (data) {
                _getData(data, dataIndices, arr)
            } else {
                _getData(DMData, dataIndices, arr);
                _getData(DMDataUF, dataIndices, arr)
            }
        } else {
            return DMDataUF.length ? DMData.concat(DMDataUF) : DMData
        }
        var arr2 = [],
            sorters = dataIndices.reduce(function(arr, di) {
                var column = columns[di];
                if (column) arr.push({
                    dataIndx: di,
                    dir: "up",
                    dataType: column.dataType,
                    sortType: column.sortType
                });
                return arr
            }, []),
            obj = {};
        for (var i = 0, len = arr.length; i < len; i++) {
            var rowData = arr[i],
                item = JSON.stringify(rowData);
            if (!obj[item]) {
                arr2.push(rowData);
                obj[item] = 1
            }
        }
        arr2 = this.iSort._sortLocalData(sorters, arr2, useCustomSort);
        return arr2
    };
    fn.getPlainOptions = function(options, di) {
        var item = options[0];
        if ($.isPlainObject(item)) {
            var keys = Object.keys(item);
            if (keys[0] !== di && keys.length === 1) {
                options = options.map(function(item) {
                    var obj = {},
                        key;
                    for (key in item) {
                        obj[di] = key;
                        obj.pq_label = item[key]
                    }
                    return obj
                })
            }
        } else {
            options = options.map(function(val) {
                var opt = {};
                opt[di] = val;
                return opt
            })
        }
        return options
    };
    fn.getDataCascade = function(di, diG, diExtra) {
        var grid = this,
            FM = grid.options.filterModel,
            order = FM.newDI.slice(),
            rules, dataIndx = diG ? [diG, di] : [di],
            index = order.indexOf(di),
            data, mode = FM.mode;
        if (mode === "AND" && order.length && FM.type !== "remote") {
            if (index >= 0) {
                order.splice(index, order.length)
            }
            if (order.length) {
                rules = order.map(function(_di) {
                    var filter = grid.getColumn({
                            dataIndx: _di
                        }).filter,
                        rules = filter.crules || [filter];
                    return {
                        dataIndx: _di,
                        crules: rules,
                        mode: filter.mode
                    }
                });
                data = grid.filter({
                    data: grid.getData(),
                    mode: "AND",
                    rules: rules
                })
            }
        }
        dataIndx = dataIndx.concat(diExtra || []);
        return grid.getData({
            data: data,
            dataIndx: dataIndx
        })
    };
    fn.removeNullOptions = function(data, di, diG) {
        var firstEmpty;
        if (diG === null) {
            return data.filter(function(rd) {
                var val = rd[di];
                if (val === null || val === "") {
                    if (!firstEmpty) {
                        firstEmpty = true;
                        rd[di] = "";
                        return true
                    }
                } else {
                    return true
                }
            })
        } else {
            return data.filter(function(rd) {
                var val = rd[di];
                if (val === null || val === "") {
                    return false
                }
                return true
            })
        }
    };
    fn.get_p_data = function() {
        var o = this.options,
            PM = o.pageModel,
            paging = PM.type,
            remotePaging, data = o.dataModel.data,
            pdata = this.pdata,
            rpp, offset, arr = [],
            arr2;
        if (paging) {
            rpp = PM.rPP;
            offset = this.riOffset;
            if (!pdata.length && data.length) {
                pdata = data.slice(offset, offset + rpp)
            }
            remotePaging = paging === "remote";
            arr = remotePaging ? new Array(offset) : data.slice(0, offset);
            arr2 = remotePaging ? [] : data.slice(offset + rpp);
            return arr.concat(pdata, arr2)
        } else {
            return pdata.length ? pdata : data
        }
    };
    fn._onDataAvailable = function(objP) {
        objP = objP || {};
        this.pdata = [];
        var options = this.options,
            apply = !objP.data,
            source = objP.source,
            sort = objP.sort,
            data = [],
            FM = options.filterModel,
            DM = options.dataModel,
            SM = options.sortModel;
        if (apply !== false) {
            if (objP.trigger !== false) {
                this._trigger("dataAvailable", objP.evt, {
                    source: source
                })
            }
        }
        if (FM && FM.on && FM.type === "local") {
            data = this.iFilterData.filterLocalData(objP).data
        } else {
            data = DM.data
        }
        if (SM.type === "local") {
            if (sort !== false) {
                if (apply) {
                    this.sort({
                        refresh: false
                    })
                } else {
                    data = this.iSort.sortLocalData(data, true)
                }
            }
        }
        if (apply === false) {
            return data
        }
        this.refreshView(objP)
    };
    fn.reset = function(ui) {
        ui = ui || {};
        var self = this,
            sort = ui.sort,
            o = self.options,
            refresh = ui.refresh !== false,
            extend = $.extend,
            sortModel, groupModel, filter = ui.filter,
            group = ui.group;
        if (!sort && !filter && !group) {
            return
        }
        if (sort) {
            sortModel = sort === true ? {
                sorter: []
            } : sort;
            extend(o.sortModel, sortModel)
        }
        if (filter) {
            !refresh && this.iFilterData.clearFilters(self.colModel)
        }
        if (group) {
            groupModel = group === true ? {
                dataIndx: []
            } : group;
            self.groupOption(groupModel, false)
        }
        if (refresh) {
            if (filter) {
                self.filter({
                    oper: "replace",
                    rules: []
                });
                self.refreshHeader()
            } else if (sort) {
                self.sort()
            } else {
                self.refreshView()
            }
        }
    };
    fn._trigger = _pq._trigger;
    fn.on = _pq.on;
    fn.one = _pq.one;
    fn.off = _pq.off;
    fn.pager = function() {
        this.pagerW = this.pagerW || this.widget().find(".pq-pager").pqPager("instance");
        return this.pagerW
    };
    fn.toolbar = function() {
        return this._toolbar.element
    };
    fn.Columns = function() {
        return this.iCols
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    _pq.cColModel = function(that) {
        this.that = that;
        this.vciArr;
        this.ciArr;
        this.init()
    };
    _pq.cColModel.prototype = {
        alter: function(cb) {
            var that = this.that;
            cb.call(that);
            that.refreshCM();
            that.refresh()
        },
        assignRowSpan: function() {
            var that = this.that,
                CMLength = that.colModel.length,
                headerCells = that.headerCells,
                column, column2, row, row2, rowSpan, depth = that.depth,
                col = 0;
            for (; col < CMLength; col++) {
                for (row = 0; row < depth; row++) {
                    column = headerCells[row][col];
                    if (col > 0 && column === headerCells[row][col - 1]) {
                        continue
                    } else if (row > 0 && column === headerCells[row - 1][col]) {
                        continue
                    }
                    rowSpan = 1;
                    for (row2 = row + 1; row2 < depth; row2++) {
                        column2 = headerCells[row2][col];
                        if (column === column2) {
                            rowSpan++
                        }
                    }
                    column.rowSpan = rowSpan
                }
            }
            return headerCells
        },
        autoGenColumns: function() {
            var that = this.that,
                o = that.options,
                CT = o.columnTemplate || {},
                CT_dataType = CT.dataType,
                CT_title = CT.title,
                CT_width = CT.width,
                data = o.dataModel.data,
                val = pq.validation,
                CM = [];
            if (data && data.length) {
                var rowData = data[0];
                $.each(rowData, function(indx, cellData) {
                    var dataType = "string";
                    if (val.isInteger(cellData)) {
                        if (cellData + "".indexOf(".") > -1) {
                            dataType = "float"
                        } else {
                            dataType = "integer"
                        }
                    } else if (val.isDate(cellData)) {
                        dataType = "date"
                    } else if (val.isFloat(cellData)) {
                        dataType = "float"
                    }
                    CM.push({
                        dataType: CT_dataType ? CT_dataType : dataType,
                        dataIndx: indx,
                        title: CT_title ? CT_title : indx,
                        width: CT_width ? CT_width : 100
                    })
                })
            }
            o.colModel = CM
        },
        cacheIndices: function() {
            var that = this.that,
                isJSON = this.getDataType() === "JSON" ? true : false,
                columns = {},
                colIndxs = {},
                validations = {},
                CM = that.colModel,
                i = 0,
                valids, dataType, CMLength = CM.length,
                vci = 0,
                vciArr = this.vciArr = [],
                ciArr = this.ciArr = [];
            for (; i < CMLength; i++) {
                var column = CM[i],
                    dataIndx = column.dataIndx;
                if (dataIndx === null) {
                    dataIndx = column.type === "detail" ? "pq_detail" : isJSON ? "dataIndx_" + i : i;
                    if (dataIndx === "pq_detail") {
                        column.dataType = "object"
                    }
                    column.dataIndx = dataIndx
                }
                columns[dataIndx] = column;
                colIndxs[dataIndx] = i;
                valids = column.validations;
                if (valids) {
                    validations[dataIndx] = validations
                }
                if (!column.hidden) {
                    ciArr[vci] = i;
                    vciArr[i] = vci;
                    vci++
                }
                if (!column.align) {
                    dataType = column.dataType;
                    if (dataType && (dataType === "integer" || dataType === "float")) {
                        column.align = "right"
                    }
                }
            }
            that.columns = columns;
            that.colIndxs = colIndxs;
            that.validations = validations
        },
        collapse: function(column) {
            var collapsible = column.collapsible,
                close = collapsible.on || false,
                CM = column.colModel || [],
                len = CM.length,
                i = len,
                col, x, hidden, hiddenCols = 0,
                last = collapsible.last,
                indx = last ? len - 1 : 0;
            if (len) {
                while (i--) {
                    col = CM[i];
                    if (last === null) {
                        hidden = col.showifOpen === close;
                        if (hidden) hiddenCols++
                    } else hidden = indx === i ? false : close;
                    col.hidden = hidden;
                    if (!hidden && (x = col.colModel) && !col.collapsible) this.each(function(_col) {
                        _col.hidden = hidden
                    }, x)
                }
                if (hiddenCols === len) {
                    this.each(function(_col) {
                        _col.hidden = false
                    }, [CM[0]])
                }
            }
        },
        each: function(cb, cm) {
            var that = this.that;
            (cm || that.options.colModel).forEach(function(col) {
                cb.call(that, col);
                col.colModel && this.each(cb, col.colModel)
            }, this)
        },
        extend: function(CM, CMT) {
            var key, val, extend = $.extend,
                i = CM.length;
            while (i--) {
                var column = CM[i];
                for (key in CMT) {
                    if (column[key] === undefined) {
                        val = CMT[key];
                        if (val && typeof val === "object") {
                            column[key] = extend(true, {}, val)
                        } else {
                            column[key] = val
                        }
                    }
                }
            }
        },
        find: function(cb, _cm) {
            var that = this.that,
                CM = _cm || that.options.colModel,
                i = 0,
                len = CM.length,
                col, ret;
            for (; i < len; i++) {
                col = CM[i];
                if (cb.call(that, col)) {
                    return col
                }
                if (col.colModel) {
                    ret = this.find(cb, col.colModel);
                    if (ret) return ret
                }
            }
        },
        getHeaderCells: function() {
            var that = this.that,
                optColModel = that.options.colModel,
                CMLength = that.colModel.length,
                depth = that.depth,
                arr = [];
            for (var row = 0; row < depth; row++) {
                arr[row] = [];
                var k = 0,
                    childCountSum = 0;
                for (var col = 0; col < CMLength; col++) {
                    var colModel;
                    if (row === 0) {
                        colModel = optColModel[k]
                    } else {
                        var parentColModel = arr[row - 1][col],
                            children = parentColModel.colModel;
                        if (!children || children.length === 0) {
                            colModel = parentColModel
                        } else {
                            var diff = col - parentColModel.leftPos,
                                childCountSum2 = 0,
                                tt = 0;
                            for (var t = 0; t < children.length; t++) {
                                childCountSum2 += children[t].childCount > 0 ? children[t].childCount : 1;
                                if (diff < childCountSum2) {
                                    tt = t;
                                    break
                                }
                            }
                            colModel = children[tt]
                        }
                    }
                    var childCount = colModel.childCount ? colModel.childCount : 1;
                    if (col === childCountSum) {
                        colModel.leftPos = col;
                        arr[row][col] = colModel;
                        childCountSum += childCount;
                        if (optColModel[k + 1]) {
                            k++
                        }
                    } else {
                        arr[row][col] = arr[row][col - 1]
                    }
                }
            }
            that.headerCells = arr;
            return arr
        },
        getDataType: function() {
            var CM = this.colModel;
            if (CM && CM[0]) {
                var dataIndx = CM[0].dataIndx;
                if (typeof dataIndx === "string") {
                    return "JSON"
                } else {
                    return "ARRAY"
                }
            }
        },
        getci: function(vci) {
            return this.ciArr[vci]
        },
        getvci: function(ci) {
            return this.vciArr[ci]
        },
        getNextVisibleCI: function(ci) {
            var vciArr = this.vciArr,
                len = this.that.colModel.length;
            for (; ci < len; ci++) {
                if (vciArr[ci] !== null) {
                    return ci
                }
            }
        },
        getPrevVisibleCI: function(ci) {
            var vciArr = this.vciArr,
                len = this.that.colModel.length;
            for (; ci >= 0; ci--) {
                if (vciArr[ci] !== null) {
                    return ci
                }
            }
        },
        getFirstVisibleCI: function() {
            return this.ciArr[0]
        },
        getLastVisibleCI: function() {
            var arr = this.ciArr;
            return arr[arr.length - 1]
        },
        getVisibleTotal: function() {
            return this.ciArr.length
        },
        init: function(ui) {
            var self = this,
                that = self.that,
                o = that.options,
                obj, CMT = o.columnTemplate,
                CM, CMLength, oCM = o.colModel;
            if (!oCM) {
                self.autoGenColumns();
                oCM = o.colModel
            }
            obj = self.nestedCols(oCM);
            that.depth = obj.depth;
            CM = that.colModel = obj.colModel;
            CMLength = CM.length;
            if (CMT) {
                self.extend(CM, CMT)
            }
            self.getHeaderCells();
            self.assignRowSpan();
            self.cacheIndices();
            that._trigger("CMInit", null, ui)
        },
        nestedCols: function(colMarr, _depth, _hidden, parent) {
            var len = colMarr.length,
                arr = [];
            if (_depth === null) _depth = 1;
            var new_depth = _depth,
                colSpan = 0,
                width = 0,
                childCount = 0,
                o_colspan = 0;
            for (var i = 0; i < len; i++) {
                var column = colMarr[i],
                    child_CM = column.colModel,
                    obj;
                if (parent) {
                    column.parent = parent
                }
                if (_hidden === true) {
                    column.hidden = _hidden
                }
                if (child_CM && child_CM.length) {
                    column.collapsible && this.collapse(column);
                    obj = this.nestedCols(child_CM, _depth + 1, column.hidden, column);
                    arr = arr.concat(obj.colModel);
                    if (obj.colSpan > 0) {
                        if (obj.depth > new_depth) {
                            new_depth = obj.depth
                        }
                        column.colSpan = obj.colSpan;
                        colSpan += obj.colSpan
                    } else {
                        column.colSpan = 0
                    }
                    o_colspan += obj.o_colspan;
                    column.o_colspan = obj.o_colspan;
                    column.childCount = obj.childCount;
                    childCount += obj.childCount
                } else {
                    if (column.hidden) {
                        column.colSpan = 0
                    } else {
                        column.colSpan = 1;
                        colSpan++
                    }
                    o_colspan++;
                    column.o_colspan = 1;
                    column.childCount = 0;
                    childCount++;
                    arr.push(column)
                }
            }
            return {
                depth: new_depth,
                colModel: arr,
                colSpan: colSpan,
                width: width,
                childCount: childCount,
                o_colspan: o_colspan
            }
        },
        reduce: function(cb, cm) {
            var that = this.that,
                newCM = [];
            (cm || that.options.colModel).forEach(function(col, ci) {
                var newCol = cb.call(that, col, ci),
                    ret, _cm;
                if (newCol) {
                    _cm = newCol.colModel;
                    if (_cm && _cm.length) {
                        ret = this.reduce(cb, _cm);
                        if (ret.length) {
                            newCol.colModel = ret;
                            newCM.push(newCol)
                        }
                    } else {
                        newCM.push(newCol)
                    }
                }
            }, this);
            return newCM
        },
        hide: function(ui) {
            var that = this.that,
                columns = that.columns;
            ui.diShow = ui.diShow || [];
            ui.diHide = ui.diHide || [];
            if (that._trigger("beforeHideCols", null, ui) !== false) {
                ui.diShow = ui.diShow.filter(function(di) {
                    var col = columns[di];
                    if (col.hidden) {
                        delete col.hidden;
                        return true
                    }
                });
                ui.diHide = ui.diHide.filter(function(di) {
                    var col = columns[di];
                    if (!col.hidden) {
                        col.hidden = true;
                        return true
                    }
                });
                that.refresh({
                    colModel: true
                });
                that._trigger("hideCols", null, ui)
            }
        }
    }
})(jQuery);
(function($) {
    $.extend($.paramquery.pqGrid.prototype, {
        parent: function() {
            return this._parent
        },
        child: function(_ui) {
            var ui = this.normalize(_ui),
                rd = ui.rowData || {},
                pq_detail = rd.pq_detail || {},
                child = pq_detail.child;
            return child
        }
    });

    function cHierarchy(that, column) {
        var self = this,
            o = that.options;
        self.that = that;
        self.type = "detail";
        self.refreshComplete = true;
        self.rowHtDetail = o.detailModel.height;
        that.on("cellClick", self.toggle.bind(self)).on("cellKeyDown", function(evt, ui) {
            if (evt.keyCode === $.ui.keyCode.ENTER) {
                return self.toggle(evt, ui)
            }
        }).on("beforeViewEmpty", self.onBeforeViewEmpty.bind(self)).on("autoRowHeight", self.onAutoRowHeight.bind(self)).one("render", function() {
            that.iRenderB.removeView = self.removeView(self, that);
            that.iRenderB.renderView = self.renderView(self, that)
        }).one("destroy", self.onDestroy.bind(self));
        column._render = self.renderCell.bind(self)
    }
    $.paramquery.cHierarchy = cHierarchy;
    cHierarchy.prototype = {
        detachCells: function($cells) {
            $cells.children().detach();
            $cells.remove()
        },
        getCls: function() {
            return "pq-detail-cont-" + this.that.uuid
        },
        getId: function(rip) {
            return "pq-detail-" + rip + "-" + this.that.uuid
        },
        getRip: function(div) {
            return div.id.split("-")[2] * 1
        },
        onAutoRowHeight: function() {
            var self = this,
                iR = this.that.iRenderB;
            iR.$ele.find("." + self.getCls()).each(function(i, detail) {
                var rip = self.getRip(detail),
                    top = iR.getHeightCell(rip);
                $(detail).css("top", top)
            })
        },
        onBeforeViewEmpty: function(evt, ui) {
            var rip = ui.rowIndxPage,
                iR = this.that.iRenderB,
                region = ui.region,
                selector = rip >= 0 ? "#" + this.getId(rip) : "." + this.getCls(),
                $details = rip >= 0 ? iR.$ele.find(selector) : iR["$c" + region].find(selector);
            this.detachCells($details)
        },
        onDestroy: function() {
            (this.that.getData() || []).forEach(function(rd) {
                rd.child && rd.child.remove()
            })
        },
        onResize: function(self, $cell) {
            var arr = [],
                timeID;
            $cell.resize(function() {
                arr.push($cell[0]);
                clearTimeout(timeID);
                timeID = setTimeout(function() {
                    var pdata = self.that.pdata,
                        arr2 = [];
                    arr.forEach(function(ele) {
                        if (document.body.contains(ele)) {
                            var rip = self.getRip(ele),
                                newHt = ele.offsetHeight,
                                rd = pdata[rip],
                                oldHt = rd.pq_detail.height || self.rowHtDetail;
                            if (oldHt !== newHt) {
                                rd.pq_detail.height = newHt;
                                arr2.push([rip, newHt - oldHt])
                            }
                        }
                    });
                    arr = [];
                    if (arr2.length) {
                        self.that._trigger("onResizeHierarchy");
                        self.softRefresh(arr2)
                    }
                }, 150)
            })
        },
        removeView: function(self, that) {
            var orig = that.iRenderB.removeView;
            return function(r1, r2, c1) {
                var ret = orig.apply(this, arguments),
                    cls = self.getCls(),
                    i, row, $row, $detail, region = this.getCellRegion(r1, c1);
                for (i = r1; i <= r2; i++) {
                    row = this.getRow(i, region);
                    if (row && row.children.length === 1) {
                        $row = $(row);
                        $detail = $row.children("." + cls);
                        if ($detail.length === 1) {
                            self.detachCells($detail);
                            row.parentNode.removeChild(row)
                        }
                    }
                }
                return ret
            }
        },
        renderView: function(self, that) {
            var orig = that.iRenderB.renderView;
            return function(r1, r2, c1, c2) {
                var ret = orig.apply(this, arguments),
                    iR = that.iRenderB;
                var cls = self.getCls() + " pq-detail",
                    o = that.options,
                    ri, rowData, fr = o.freezeRows,
                    initDetail = o.detailModel.init,
                    data = this.data;
                if (!self.refreshComplete) {
                    return
                }
                self.refreshComplete = false;
                for (ri = r1; ri <= r2; ri++) {
                    rowData = data[ri];
                    if (rowData && !rowData.pq_hidden) {
                        var pq_detail = rowData.pq_detail = rowData.pq_detail || {},
                            show = pq_detail.show,
                            $detail = pq_detail.child;
                        if (!show) continue;
                        if (!$detail) {
                            if (typeof initDetail === "function") {
                                $detail = initDetail.call(that, {
                                    rowData: rowData
                                });
                                pq_detail.child = $detail
                            }
                        }
                        var $cell = $detail.parent(),
                            top = iR.getHeightCell(ri),
                            paddingLeft = that.dims.wdContLeft + 5,
                            style = "position:absolute;left:0;top:" + top + "px;padding:5px;width:100%;overflow:hidden;padding-left:" + paddingLeft + "px;";
                        if ($cell.length) {
                            if (!document.body.contains($cell[0])) {
                                throw "incorrectly detached detail"
                            }
                            $cell.css({
                                top: top
                            })
                        } else {
                            $cell = $("<div role='gridcell' id='" + self.getId(ri) + "' class='" + cls + "' style='" + style + "'></div>").append($detail);
                            $(iR.getRow(ri, ri < fr ? "tr" : "right")).append($cell);
                            self.onResize(self, $cell)
                        }
                        var $grids = $cell.find(".pq-grid"),
                            j = 0,
                            gridLen = $grids.length,
                            $grid, grid;
                        for (; j < gridLen; j++) {
                            $grid = $($grids[j]);
                            grid = $grid.pqGrid("instance");
                            grid._parent = that;
                            if ($grid.hasClass("pq-pending-refresh") && $grid.is(":visible")) {
                                $grid.removeClass("pq-pending-refresh");
                                grid.refresh()
                            }
                        }
                    }
                }
                self.refreshComplete = true;
                return ret
            }
        },
        renderCell: function(ui) {
            var DTM = this.that.options.detailModel,
                cellData = ui.cellData,
                rd = ui.rowData,
                hicon;
            if (rd.pq_gsummary || rd.pq_gtitle) {
                return ""
            }
            hicon = cellData && cellData.show ? DTM.expandIcon : DTM.collapseIcon;
            return "<div class='ui-icon " + hicon + "'></div>"
        },
        rowExpand: function(_objP) {
            var that = this.that,
                objP = that.normalize(_objP),
                o = that.options,
                rowData = objP.rowData,
                rip = objP.rowIndxPage,
                detM = o.detailModel,
                pq_detail, dataIndx = "pq_detail";
            if (rowData) {
                if (that._trigger("beforeRowExpand", null, objP) === false) {
                    return
                }
                pq_detail = rowData[dataIndx] = rowData[dataIndx] || {};
                pq_detail.show = true;
                if (!detM.cache) {
                    this.rowInvalidate(objP)
                }
                this.softRefresh([
                    [rip, pq_detail.height || this.rowHtDetail]
                ], objP)
            }
        },
        rowInvalidate: function(objP) {
            var that = this.that,
                rowData = that.getRowData(objP),
                dataIndx = "pq_detail",
                pq_detail = rowData[dataIndx],
                $temp = pq_detail ? pq_detail.child : null;
            if ($temp) {
                $temp.remove();
                rowData[dataIndx].child = null
            }
        },
        rowCollapse: function(_objP) {
            var that = this.that,
                o = that.options,
                objP = that.normalize(_objP),
                rowData = objP.rowData,
                rip = objP.rowIndxPage,
                detM = o.detailModel,
                di = "pq_detail",
                pq_detail = rowData ? rowData[di] : null;
            if (pq_detail && pq_detail.show) {
                objP.close = true;
                if (that._trigger("beforeRowExpand", null, objP) === false) {
                    return
                }
                if (!detM.cache) {
                    this.rowInvalidate(objP)
                }
                pq_detail.show = false;
                this.softRefresh([
                    [rip, -(pq_detail.height || this.rowHtDetail)]
                ], objP)
            }
        },
        softRefresh: function(arr, objP) {
            var that = this.that,
                iR = that.iRenderB;
            iR.initRowHtArrDetailSuper(arr);
            iR.setPanes();
            iR.setCellDims(true);
            objP && that.refreshRow(objP);
            iR.refresh()
        },
        toggle: function(evt, ui) {
            var that = this.that,
                column = ui.column,
                rowData = ui.rowData,
                pq_detail, rowIndx = ui.rowIndx,
                type = this.type;
            if (rowData.pq_gtitle || rowData.pq_gsummary) {
                return
            }
            if (column && column.type === type) {
                pq_detail = rowData.pq_detail = rowData.pq_detail || {}, that[pq_detail.show ? "rowCollapse" : "rowExpand"]({
                    rowIndx: rowIndx
                })
            }
        }
    }
})(jQuery);
(function($) {
    var cCells = function(that) {
        var self = this;
        self.that = that;
        self.class = "pq-grid-overlay";
        self.ranges = [];
        that.on("assignTblDims", self.onRefresh(self, that))
    };
    $.paramquery.cCells = cCells;
    cCells.prototype = {
        addBlock: function(range, remove) {
            if (!range || !this.addUnique(this.ranges, range)) {
                return
            }
            var that = this.that,
                r1 = range.r1,
                c1 = range.c1,
                r2 = range.r2,
                c2 = range.c2,
                _cls = this.serialize(r1, c1, r2, c2),
                cls = _cls + " " + range.type,
                clsN = _cls + " pq-number-overlay",
                clsH = _cls + " pq-head-overlay",
                iRender = that.iRenderB,
                gct = function(ri, ci) {
                    return iRender.getCellCont(ri, ci)
                },
                tmp = this.shiftRC(r1, c1, r2, c2);
            if (!tmp) {
                return
            }
            r1 = tmp[0];
            c1 = tmp[1];
            r2 = tmp[2];
            c2 = tmp[3];
            var $contLT = gct(r1, c1),
                $contRB = gct(r2, c2),
                $contTR, $contBL, parLT_wd, parLT_ht, left, top, right, bottom, ht, wd;
            tmp = iRender.getCellXY(r1, c1);
            left = tmp[0] - 1;
            top = tmp[1] - 1;
            tmp = iRender.getCellCoords(r2, c2);
            right = tmp[2];
            bottom = tmp[3];
            ht = bottom - top, wd = right - left;
            if ($contLT === $contRB) {
                this.addLayer(left, top, ht, wd, cls, $contLT)
            } else {
                $contTR = gct(r1, c2);
                $contBL = gct(r2, c1);
                parLT_wd = $contLT[0].offsetWidth;
                parLT_ht = $contLT[0].offsetHeight;
                if ($contBL === $contLT) {
                    this.addLayer(left, top, ht, parLT_wd - left, cls, $contLT, "border-right:0;");
                    this.addLayer(0, top, ht, right, cls, $contRB, "border-left:0;")
                } else if ($contLT === $contTR) {
                    this.addLayer(left, top, parLT_ht - top, wd, cls, $contLT, "border-bottom:0;");
                    this.addLayer(left, 0, bottom, wd, cls, $contRB, "border-top:0;")
                } else {
                    this.addLayer(left, top, parLT_ht - top, parLT_wd - left, cls, $contLT, "border-right:0;border-bottom:0");
                    this.addLayer(0, top, parLT_ht - top, right, cls, $contTR, "border-left:0;border-bottom:0");
                    this.addLayer(left, 0, bottom, parLT_wd - left, cls, $contBL, "border-right:0;border-top:0");
                    this.addLayer(0, 0, bottom, right, cls, $contRB, "border-left:0;border-top:0")
                }
            }
            wd = that.options.numberCell.outerWidth || 0;
            this.addLayer(0, top, ht, wd, clsN, iRender.$clt, "");
            this.addLayer(0, top, ht, wd, clsN, iRender.$cleft, "");
            if (that.options.showHeader !== false) {
                iRender = that.iRenderHead;
                tmp = iRender.getCellXY(0, c1);
                left = tmp[0];
                top = tmp[1];
                tmp = iRender.getCellCoords(that.headerCells.length - 1, c2);
                right = tmp[2];
                bottom = tmp[3];
                ht = bottom - top, wd = right - left;
                var $cont = iRender.$cright;
                this.addLayer(left, top, ht, wd, clsH, $cont, "");
                $cont = iRender.$cleft;
                this.addLayer(left, top, ht, wd, clsH, $cont, "")
            }
        },
        addLayer: function(left, top, ht, wd, cls, $cont, _style) {
            var style = "left:" + left + "px;top:" + top + "px;height:" + ht + "px;width:" + wd + "px;" + (_style || "");
            $("<svg class='" + this.class + " " + cls + "' style='" + style + "'></svg>").appendTo($cont)
        },
        addUnique: function(ranges, range) {
            var found = ranges.filter(function(_range) {
                return range.r1 === _range.r1 && range.c1 === _range.c1 && range.r2 === _range.r2 && range.c2 === _range.c2
            })[0];
            if (!found) {
                ranges.push(range);
                return true
            }
        },
        getLastVisibleFrozenCI: function() {
            var that = this.that,
                CM = that.colModel,
                i = that.options.freezeCols - 1;
            for (; i >= 0; i--) {
                if (!CM[i].hidden) {
                    return i
                }
            }
        },
        getLastVisibleFrozenRIP: function() {
            var that = this.that,
                data = that.get_p_data(),
                offset = that.riOffset,
                i = that.options.freezeRows + offset - 1;
            for (; i >= offset; i--) {
                if (!data[i].pq_hidden) {
                    return i - offset
                }
            }
        },
        getSelection: function() {
            var that = this.that,
                data = that.get_p_data(),
                CM = that.colModel,
                cells = [];
            this.ranges.forEach(function(range) {
                var r1 = range.r1,
                    r2 = range.r2,
                    c1 = range.c1,
                    c2 = range.c2,
                    rd, i, j;
                for (i = r1; i <= r2; i++) {
                    rd = data[i];
                    for (j = c1; j <= c2; j++) {
                        cells.push({
                            dataIndx: CM[j].dataIndx,
                            colIndx: j,
                            rowIndx: i,
                            rowData: rd
                        })
                    }
                }
            });
            return cells
        },
        isSelected: function(ui) {
            var that = this.that,
                objP = that.normalize(ui),
                ri = objP.rowIndx,
                ci = objP.colIndx;
            if (ci === null || ri === null) {
                return null
            }
            return !!this.ranges.find(function(range) {
                var r1 = range.r1,
                    r2 = range.r2,
                    c1 = range.c1,
                    c2 = range.c2;
                if (ri >= r1 && ri <= r2 && ci >= c1 && ci <= c2) {
                    return true
                }
            })
        },
        onRefresh: function(self, that) {
            var id;
            return function() {
                clearTimeout(id);
                id = setTimeout(function() {
                    if (that.element) {
                        self.removeAll();
                        that.Selection().address().forEach(function(range) {
                            self.addBlock(range)
                        })
                    }
                }, 50)
            }
        },
        removeAll: function() {
            var that = this.that,
                $cont = that.$cont,
                $header = that.$header;
            if ($cont) {
                $cont.children().children().children("svg").remove();
                $header.children().children().children("svg").remove()
            }
            this.ranges = []
        },
        removeBlock: function(range) {
            if (range) {
                var r1 = range.r1,
                    c1 = range.c1,
                    r2 = range.r2,
                    c2 = range.c2,
                    that = this.that,
                    cls, indx = this.ranges.findIndex(function(_range) {
                        return r1 === _range.r1 && c1 === _range.c1 && r2 === _range.r2 && c2 === _range.c2
                    });
                if (indx >= 0) {
                    this.ranges.splice(indx, 1);
                    cls = "." + this.class + "." + this.serialize(r1, c1, r2, c2);
                    that.$cont.find(cls).remove();
                    that.$header.find(cls).remove()
                }
            }
        },
        serialize: function(r1, c1, r2, c2) {
            return "r1" + r1 + "c1" + c1 + "r2" + r2 + "c2" + c2
        },
        shiftRC: function(r1, c1, r2, c2) {
            var that = this.that,
                iM = that.iMerge,
                o = that.options,
                pdata_len = that.pdata.length,
                obj, fr = o.freezeRows,
                offset = that.riOffset;
            r1 -= offset;
            r2 -= offset;
            r1 = r1 < fr ? Math.max(r1, Math.min(0, r2)) : r1;
            if (r1 >= pdata_len || r2 < 0) {
                return
            } else {
                r2 = Math.min(r2, pdata_len - 1)
            }
            r1 += offset;
            r2 += offset;
            if (iM.ismergedCell(r1, c1)) {
                obj = iM.getRootCell(r1, c1);
                r1 = obj.o_ri;
                c1 = obj.o_ci
            }
            if (iM.ismergedCell(r2, c2)) {
                obj = iM.getRootCell(r2, c2);
                r2 = obj.o_ri + obj.o_rc - 1;
                c2 = obj.o_ci + obj.o_cc - 1
            }
            r1 -= offset;
            r2 -= offset;
            r1 = Math.max(r1, 0);
            r2 = Math.min(r2, pdata_len - 1);
            c2 = Math.min(c2, that.colModel.length - 1);
            return [r1, c1, r2, c2]
        }
    }
})(jQuery);
(function($) {
    $.paramquery.pqGrid.prototype.Range = function(range, expand) {
        return new pq.Range(this, range, "range", expand)
    };
    var pq = window.pq = window.pq || {};
    pq.extend = function(base, sub, methods) {
        var fn = function() {};
        fn.prototype = base.prototype;
        var _p = sub.prototype = new fn;
        var _bp = base.prototype;
        for (var method in methods) {
            var _bpm = _bp[method],
                _spm = methods[method];
            if (_bpm) {
                _p[method] = function(_bpm, _spm) {
                    return function() {
                        var old_super = this._super,
                            ret;
                        this._super = function() {
                            return _bpm.apply(this, arguments)
                        };
                        ret = _spm.apply(this, arguments);
                        this._super = old_super;
                        return ret
                    }
                }(_bpm, _spm)
            } else {
                _p[method] = _spm
            }
        }
        _p.constructor = sub;
        _p._base = base;
        _p._bp = function(method) {
            var args = arguments;
            Array.prototype.shift.call(args);
            return _bp[method].apply(this, args)
        }
    };
    var Range = pq.Range = function(that, range, type, expand) {
        if (that === null) {
            throw "invalid param"
        }
        this.that = that;
        this._areas = [];
        if (this instanceof Range === false) {
            return new Range(that, range, type, expand)
        }
        this._type = type || "range";
        this.init(range, expand)
    };
    Range.prototype = $.extend({
        add: function(range) {
            this.init(range)
        },
        address: function() {
            return this._areas
        },
        addressLast: function() {
            var areas = this.address();
            return areas[areas.length - 1]
        },
        clear: function() {
            return this.copy({
                copy: false,
                cut: true,
                source: "clear"
            })
        },
        clearOther: function(_range) {
            var range = this._normal(_range, true),
                sareas = this.address(),
                i;
            for (i = sareas.length - 1; i >= 0; i--) {
                var srange = sareas[i];
                if (!(srange.r1 === range.r1 && srange.c1 === range.c1 && srange.r2 === range.r2 && srange.c2 === range.c2)) {
                    sareas.splice(i, 1)
                }
            }
        },
        newLine: function(cv) {
            return '"' + cv.replace(/"/g, '""') + '"'
        },
        _copyArea: function(r1, r2, c1, c2, CM, buffer, rowList, p_data, cut, copy, render) {
            var that = this.that,
                cv, cv2, str, ri, ci, di, column, dataType, readCell = that.readCell,
                getRenderVal = this.getRenderVal,
                iMerge = that.iMerge,
                stringType = [],
                offset = that.riOffset,
                iGV = that.iRenderB;
            for (ci = c1; ci <= c2; ci++) {
                column = CM[ci];
                dataType = column.dataType;
                stringType[ci] = !dataType || dataType === "string" || dataType === "html"
            }
            for (ri = r1; ri <= r2; ri++) {
                var rowBuffer = [],
                    rd = p_data[ri],
                    newRow = {},
                    oldRow = {},
                    objR = {
                        rowIndx: ri,
                        rowIndxPage: ri - offset,
                        rowData: rd,
                        Export: true,
                        exportClip: true
                    };
                for (ci = c1; ci <= c2; ci++) {
                    column = CM[ci];
                    di = column.dataIndx;
                    if (column.copy === false) {
                        continue
                    }
                    cv = rd[di];
                    if (copy) {
                        cv2 = readCell(rd, column, iMerge, ri, ci);
                        if (cv2 === cv) {
                            objR.colIndx = ci;
                            objR.column = column;
                            objR.dataIndx = di;
                            cv2 = getRenderVal(objR, render, iGV)[0];
                            if (stringType[ci] && /(\r|\n)/.test(cv2)) {
                                cv2 = this.newLine(cv2)
                            }
                        }
                        rowBuffer.push(cv2)
                    }
                    if (cut && cv !== undefined) {
                        newRow[di] = undefined;
                        oldRow[di] = cv
                    }
                }
                if (cut) {
                    rowList.push({
                        rowIndx: ri,
                        rowData: rd,
                        oldRow: oldRow,
                        newRow: newRow
                    })
                }
                str = rowBuffer.join("	");
                rowBuffer = [];
                buffer.push(str || " ")
            }
        },
        copy: function(ui) {
            ui = ui || {};
            var that = this.that,
                dest = ui.dest,
                cut = !!ui.cut,
                copy = ui.copy === null ? true : ui.copy,
                source = ui.source || (cut ? "cut" : "copy"),
                history = ui.history,
                allowInvalid = ui.allowInvalid,
                rowList = [],
                buffer = [],
                p_data = that.get_p_data(),
                CM = that.colModel,
                render = ui.render,
                type, r1, c1, r2, c2, areas = this.address();
            history = history === null ? true : history;
            allowInvalid = allowInvalid === null ? true : allowInvalid;
            render = render === null ? that.options.copyModel.render : render;
            if (!areas.length) {
                return
            }
            areas.forEach(function(area) {
                type = area.type, r1 = area.r1, c1 = area.c1, r2 = type === "cell" ? r1 : area.r2, c2 = type === "cell" ? c1 : area.c2;
                this._copyArea(r1, r2, c1, c2, CM, buffer, rowList, p_data, cut, copy, render)
            }, this);
            if (copy) {
                var str = buffer.join("\n");
                if (ui.clip) {
                    var $clip = ui.clip;
                    $clip.val(str);
                    $clip.select()
                } else {
                    that._setGlobalStr(str)
                }
            }
            if (dest) {
                that.paste({
                    dest: dest,
                    rowList: rowList,
                    history: history,
                    allowInvalid: allowInvalid
                })
            } else if (cut) {
                var ret = that._digestData({
                    updateList: rowList,
                    source: source,
                    history: history,
                    allowInvalid: allowInvalid
                });
                if (ret !== false) {
                    that.refresh({
                        source: "cut",
                        header: false
                    })
                }
            }
        },
        _countArea: function(nrange) {
            var arr = nrange,
                type = nrange.type,
                r1 = arr.r1,
                c1 = arr.c1,
                r2 = arr.r2,
                c2 = arr.c2;
            if (type === "cell") {
                return 1
            } else if (type === "row") {
                return 0
            } else {
                return (r2 - r1 + 1) * (c2 - c1 + 1)
            }
        },
        count: function() {
            var type_range = this._type === "range",
                arr = this.address(),
                tot = 0,
                len = arr.length;
            for (var i = 0; i < len; i++) {
                tot += type_range ? this._countArea(arr[i]) : 1
            }
            return tot
        },
        cut: function(ui) {
            ui = ui || {};
            ui.cut = true;
            return this.copy(ui)
        },
        getIndx: function(_indx) {
            return _indx === null ? this._areas.length - 1 : _indx
        },
        getValue: function() {
            var areas = this.address(),
                area, rd, arr = [],
                val, that = this.that,
                r1, c1, r2, c2, i, j, data;
            if (areas.length) {
                area = areas[0];
                r1 = area.r1;
                c1 = area.c1;
                r2 = area.r2;
                c2 = area.c2;
                data = that.get_p_data();
                for (i = r1; i <= r2; i++) {
                    rd = data[i];
                    for (j = c1; j <= c2; j++) {
                        val = rd[that.colModel[j].dataIndx];
                        arr.push(val)
                    }
                }
                return arr
            }
        },
        hide: function(ui) {
            ui = ui || {};
            var that = this.that,
                CM = that.colModel,
                j, data = that.get_p_data(),
                areas = this._areas;
            areas.forEach(function(area) {
                var type = area.type,
                    r1 = area.r1,
                    r2 = area.r2,
                    c1 = area.c1,
                    c2 = area.c2;
                if (type === "column") {
                    for (j = c1; j <= c2; j++) {
                        CM[j].hidden = true
                    }
                } else if (type === "row") {
                    for (j = r1; j <= r2; j++) {
                        data[j].pq_hidden = true
                    }
                }
            });
            if (ui.refresh !== false) {
                that.refreshView()
            }
        },
        indexOf: function(range) {
            range = this._normal(range);
            var r1 = range.r1,
                c1 = range.c1,
                r2 = range.r2,
                c2 = range.c2,
                areas = this.address(),
                i = 0,
                len = areas.length,
                a;
            for (; i < len; i++) {
                a = areas[i];
                if (a.type !== "row" && r1 >= a.r1 && r2 <= a.r2 && c1 >= a.c1 && c2 <= a.c2) {
                    return i
                }
            }
            return -1
        },
        index: function(range) {
            range = this._normal(range);
            var type = range.type,
                r1 = range.r1,
                c1 = range.c1,
                r2 = range.r2,
                c2 = range.c2,
                areas = this.address(),
                i = 0,
                len = areas.length,
                a;
            for (; i < len; i++) {
                a = areas[i];
                if (type === a.type && r1 === a.r1 && r2 === a.r2 && c1 === a.c1 && c2 === a.c2) {
                    return i
                }
            }
            return -1
        },
        init: function(range, expand) {
            expand = expand !== false;
            if (range) {
                if (typeof range.push === "function") {
                    for (var i = 0, len = range.length; i < len; i++) {
                        this.init(range[i], expand)
                    }
                } else {
                    var nrange = this._normal(range, expand),
                        areas = this._areas = this._areas || [];
                    if (nrange) {
                        areas.push(nrange)
                    }
                }
            }
        },
        merge: function(ui) {
            ui = ui || {};
            var that = this.that,
                o = that.options,
                mc = o.mergeCells,
                areas = this._areas,
                rc, cc, area = areas[0];
            if (area) {
                rc = area.r2 - area.r1 + 1;
                cc = area.c2 - area.c1 + 1;
                if (rc > 1 || cc > 1) {
                    area.rc = rc;
                    area.cc = cc;
                    mc.push(area);
                    if (ui.refresh !== false) {
                        that.refreshView()
                    }
                }
            }
        },
        replace: function(_range, _indx) {
            var range = this._normal(_range),
                sareas = this._areas,
                indx = this.getIndx(_indx);
            sareas.splice(indx, 1, range)
        },
        remove: function(range) {
            var areas = this._areas,
                indx = this.indexOf(range);
            if (indx >= 0) {
                areas.splice(indx, 1)
            }
        },
        resize: function(_range, _indx) {
            var range = this._normal(_range),
                sareas = this._areas,
                indx = this.getIndx(_indx),
                sarea = sareas[indx];
            ["r1", "c1", "r2", "c2", "rc", "cc", "type"].forEach(function(key) {
                sarea[key] = range[key]
            });
            return this
        },
        rows: function(indx) {
            var that = this.that,
                narr = [],
                arr = this.addressLast();
            if (arr) {
                var r1 = arr.r1,
                    c1 = arr.c1,
                    r2 = arr.r2,
                    c2 = arr.c2,
                    type = arr.type,
                    indx1 = indx === null ? r1 : r1 + indx,
                    indx2 = indx === null ? r2 : r1 + indx;
                for (var i = indx1; i <= indx2; i++) {
                    narr.push({
                        r1: i,
                        c1: c1,
                        r2: i,
                        c2: c2,
                        type: type
                    })
                }
            }
            return pq.Range(that, narr, "row")
        },
        _normal: function(range, expand) {
            if (range.type) {
                return range
            }
            var arr;
            if (typeof range.push === "function") {
                arr = [];
                for (var i = 0, len = range.length; i < len; i++) {
                    var ret = this._normal(range[i], expand);
                    if (ret) {
                        arr.push(ret)
                    }
                }
                return arr
            }
            var that = this.that,
                data = that.get_p_data(),
                rmax = data.length - 1,
                CM = that.colModel,
                cmax = CM.length - 1,
                r1 = range.r1,
                c1 = range.c1,
                r1 = r1 > rmax ? rmax : r1,
                c1 = c1 > cmax ? cmax : c1,
                rc = range.rc,
                cc = range.cc,
                r2 = rc ? r1 + rc - 1 : range.r2,
                c2 = cc ? c1 + cc - 1 : range.c2,
                r2 = r2 > rmax ? rmax : r2,
                c2 = c2 > cmax ? cmax : c2,
                tmp, type;
            rc = r2 - r1 + 1;
            cc = c2 - c1 + 1;
            if (cmax < 0 || rmax < 0) {
                return null
            }
            if (r1 > r2) {
                tmp = r1;
                r1 = r2;
                r2 = tmp
            }
            if (c1 > c2) {
                tmp = c1;
                c1 = c2;
                c2 = tmp
            }
            if (r1 === null && c1 === null) {
                return
            }
            if (r1 === null) {
                r1 = 0;
                r2 = rmax;
                c2 = c2 === null ? c1 : c2;
                type = "column"
            } else if (c1 === null) {
                if (!range._type) {}
                c1 = 0;
                r2 = r2 === null ? r1 : r2;
                c2 = cmax;
                type = range._type || "row"
            } else if (r2 === null || r1 === r2 && c1 === c2) {
                type = "cell";
                r2 = r1;
                c2 = c1
            } else {
                type = "block"
            }
            if (expand) {
                arr = that.iMerge.inflateRange(r1, c1, r2, c2);
                r1 = arr[0];
                c1 = arr[1];
                r2 = arr[2];
                c2 = arr[3]
            }
            range.r1 = r1;
            range.c1 = c1;
            range.r2 = r2;
            range.c2 = c2;
            range.rc = rc;
            range.cc = cc;
            range.type = range.type || type;
            return range
        },
        select: function() {
            var that = this.that,
                iS = that.iSelection,
                areas = this._areas;
            if (areas.length) {
                iS.removeAll({
                    trigger: false
                });
                areas.forEach(function(area) {
                    iS.add(area, false)
                });
                iS.trigger()
            }
            return this
        },
        unhide: function(ui) {
            ui = ui || {};
            var that = this.that,
                CM = that.colModel,
                data = that.get_p_data(),
                j, areas = this._areas;
            areas.forEach(function(area) {
                var type = area.type,
                    r1 = area.r1,
                    r2 = area.r2,
                    c1 = area.c1,
                    c2 = area.c2;
                if (type === "column") {
                    for (j = c1; j <= c2; j++) {
                        CM[j].hidden = false
                    }
                } else if (type === "row") {
                    for (j = r1; j <= r2; j++) {
                        data[j].pq_hidden = false
                    }
                }
            });
            if (ui.refresh !== false) {
                that.refreshView()
            }
        },
        unmerge: function(ui) {
            ui = ui || {};
            var that = this.that,
                o = that.options,
                mc = o.mergeCells,
                areas = this._areas,
                area = areas[0];
            if (area) {
                for (var i = 0; i < mc.length; i++) {
                    var mcRec = mc[i];
                    if (mcRec.r1 === area.r1 && mcRec.c1 === area.c1) {
                        mc.splice(i, 1);
                        break
                    }
                }
                if (ui.refresh !== false) {
                    that.refreshView()
                }
            }
        },
        value: function(val) {
            var ii = 0,
                that = this.that,
                CM = that.colModel,
                area, r1, c1, r2, c2, rowList = [],
                areas = this.address();
            if (val === undefined) {
                return this.getValue()
            }
            for (var i = 0; i < areas.length; i++) {
                area = areas[i];
                r1 = area.r1;
                c1 = area.c1;
                r2 = area.r2;
                c2 = area.c2;
                for (var j = r1; j <= r2; j++) {
                    var obj = that.normalize({
                            rowIndx: j
                        }),
                        rd = obj.rowData,
                        ri = obj.rowIndx,
                        oldRow = {},
                        newRow = {};
                    for (var k = c1; k <= c2; k++) {
                        var dataIndx = CM[k].dataIndx;
                        newRow[dataIndx] = val[ii++];
                        oldRow[dataIndx] = rd[dataIndx]
                    }
                    rowList.push({
                        rowData: rd,
                        rowIndx: ri,
                        newRow: newRow,
                        oldRow: oldRow
                    })
                }
            }
            if (rowList.length) {
                that._digestData({
                    updateList: rowList,
                    source: "range"
                });
                that.refresh({
                    header: false
                })
            }
            return this
        }
    }, pq.mixin.render);

    function selectEndDelegate(evt) {
        if (!evt.shiftKey || evt.type === "pqGrid:mousePQUp") {
            this._trigger("selectEnd", null, {
                selection: this.Selection()
            });
            this.off("mousePQUp", selectEndDelegate);
            this.off("keyUp", selectEndDelegate)
        }
    }
    var Selection = pq.Selection = function(that, range) {
        if (that === null) {
            throw "invalid param"
        }
        if (this instanceof Selection === false) {
            return new Selection(that, range)
        }
        this._areas = [];
        this.that = that;
        this.iCells = new $.paramquery.cCells(that);
        this._base(that, range)
    };
    pq.extend(Range, Selection, {
        add: function(range, trigger) {
            var narea = this._normal(range, true),
                iC = this.iCells,
                indx = this.indexOf(narea);
            if (indx >= 0) {
                return
            }
            iC.addBlock(narea);
            this._super(narea);
            if (trigger !== false) {
                this.trigger()
            }
        },
        clearOther: function(_range) {
            var iCells = this.iCells,
                range = this._normal(_range, true);
            this.address().forEach(function(srange) {
                if (!(srange.r1 === range.r1 && srange.c1 === range.c1 && srange.r2 === range.r2 && srange.c2 === range.c2)) {
                    iCells.removeBlock(srange)
                }
            });
            this._super(range);
            this.trigger()
        },
        getSelection: function() {
            return this.iCells.getSelection()
        },
        isSelected: function(ui) {
            return this.iCells.isSelected(ui)
        },
        removeAll: function(ui) {
            ui = ui || {};
            if (this._areas.length) {
                this.iCells.removeAll();
                this._areas = [];
                if (ui.trigger !== false) {
                    this.trigger()
                }
            }
        },
        resizeOrReplace: function(range, indx) {
            this.resize(range, indx) || this.replace(range, indx)
        },
        replace: function(_range, _indx) {
            var iCells = this.iCells,
                range = this._normal(_range),
                sareas = this._areas,
                indx = this.getIndx(_indx),
                srange = sareas[indx];
            iCells.removeBlock(srange);
            iCells.addBlock(range);
            this._super(range, indx);
            this.trigger()
        },
        resize: function(_range, _indx) {
            var range = this._normal(_range, true),
                r1 = range.r1,
                c1 = range.c1,
                r2 = range.r2,
                c2 = range.c2,
                sareas = this._areas || [];
            if (!sareas.length) {
                return false
            }
            var indx = this.getIndx(_indx),
                srange = sareas[indx],
                sr1 = srange.r1,
                sc1 = srange.c1,
                sr2 = srange.r2,
                sc2 = srange.c2,
                topLeft = sr1 === r1 && sc1 === c1,
                topRight = sr1 === r1 && sc2 === c2,
                bottomLeft = sr2 === r2 && sc1 === c1,
                bottomRight = sr2 === r2 && sc2 === c2;
            if (topLeft && topRight && bottomLeft && bottomRight) {
                return true
            }
        },
        selectAll: function(ui) {
            ui = ui || {};
            var type = ui.type,
                that = this.that,
                CM = that.colModel,
                all = ui.all,
                r1 = all ? 0 : that.riOffset,
                data_len = all ? that.get_p_data().length : that.pdata.length,
                cm_len = CM.length - 1,
                range, r2 = r1 + data_len - 1;
            if (type === "row") {
                range = {
                    r1: r1,
                    r2: r2
                };
                that.Range(range).select()
            } else {
                range = {
                    r1: r1,
                    c1: 0
                };
                range.r2 = r2;
                range.c2 = cm_len;
                that.Range(range).select()
            }
            return this
        },
        trigger: function() {
            var that = this.that;
            that._trigger("selectChange", null, {
                selection: this
            });
            that.off("mousePQUp", selectEndDelegate);
            that.off("keyUp", selectEndDelegate);
            that.on("mousePQUp", selectEndDelegate);
            that.on("keyUp", selectEndDelegate)
        }
    })
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    $.widget("paramquery.pqToolbar", {
        options: {
            items: [],
            gridInstance: null,
            events: {
                button: "click",
                select: "change",
                checkbox: "change",
                textbox: "change",
                file: "change"
            }
        },
        _create: function() {
            var o = this.options,
                that = o.gridInstance,
                events = o.events,
                event, listener, bootstrap = o.bootstrap,
                BS_on = bootstrap.on,
                CM = that.colModel,
                timeout = that.options.filterModel.timeout,
                items = o.items,
                element = this.element,
                i = 0,
                len = items.length;
            element.addClass("pq-toolbar");
            for (; i < len; i++) {
                var item = items[i],
                    type = item.type,
                    ivalue = item.value,
                    icon = item.icon,
                    options = item.options || {},
                    label = item.label,
                    listener = item.listener,
                    listeners = listener ? [listener] : item.listeners,
                    listeners = listeners || [function() {}],
                    itemcls = item.cls,
                    cls = itemcls ? itemcls : "",
                    cls = BS_on && type === "button" ? bootstrap.btn + " " + cls : cls,
                    cls = cls ? "class='" + cls + "'" : "",
                    itemstyle = item.style,
                    style = itemstyle ? "style='" + itemstyle + "'" : "",
                    itemattr = item.attr,
                    attr = itemattr ? itemattr : "",
                    labelOpen = label ? "<label " + style + ">" + label : "",
                    labelClose = label ? "</label>" : "",
                    strStyleClsAttr = label && type !== "button" && type !== "file" ? [cls, attr] : [cls, attr, style],
                    strStyleClsAttr = strStyleClsAttr.join(" "),
                    inp, $ctrl, $ctrlInner;
                item.options = options;
                if (type === "textbox") {
                    $ctrl = $([labelOpen, "<input type='text' " + strStyleClsAttr + ">", labelClose].join(""))
                } else if (type === "textarea") {
                    $ctrl = $([labelOpen, "<textarea " + strStyleClsAttr + "></textarea>", labelClose].join(""))
                } else if (type === "select") {
                    if (typeof options === "function") {
                        options = options.call(that, {
                            colModel: CM
                        })
                    }
                    options = options || [];
                    inp = _pq.select({
                        options: options,
                        attr: strStyleClsAttr,
                        prepend: item.prepend,
                        groupIndx: item.groupIndx,
                        valueIndx: item.valueIndx,
                        labelIndx: item.labelIndx
                    });
                    $ctrl = $([labelOpen, inp, labelClose].join(""))
                } else if (type === "file") {
                    $ctrl = $(["<label class='btn btn-default' " + strStyleClsAttr + ">", label || "File", "<input type='file' style='display:none;'>", "</label>"].join(""))
                } else if (type === "checkbox") {
                    $ctrl = $([label ? "<label " + style + ">" : "", "<input type='checkbox' ", ivalue ? "checked='checked' " : "", strStyleClsAttr, ">", label ? label + "</label>" : ""].join(""))
                } else if (type === "separator") {
                    $ctrl = $("<span class='pq-separator' " + [attr, style].join(" ") + "></span>")
                } else if (type === "button") {
                    var bicon = "";
                    if (BS_on) {
                        bicon = icon ? "<span class='glyphicon " + icon + "'></span>" : ""
                    }
                    $ctrl = $("<button type='button' " + strStyleClsAttr + ">" + bicon + label + "</button>");
                    $.extend(options, {
                        label: label ? label : false,
                        icon: icon,
                        icons: {
                            primary: BS_on ? "" : icon
                        }
                    });
                    $ctrl.button(options)
                } else if (typeof type === "string") {
                    $ctrl = $(type)
                } else if (typeof type === "function") {
                    inp = type.call(that, {
                        colModel: CM,
                        cls: cls
                    });
                    $ctrl = $(inp)
                }
                $ctrl.appendTo(element);
                $ctrlInner = this.getInner($ctrl, label, type);
                if (type !== "checkbox" && ivalue !== undefined) {
                    $ctrlInner.val(ivalue)
                }
                for (var j = 0, lenj = listeners.length; j < lenj; j++) {
                    listener = listeners[j];
                    var _obj = {};
                    if (typeof listener === "function") {
                        _obj[events[type]] = listener
                    } else {
                        _obj = listener
                    }
                    for (event in _obj) {
                        pq.fakeEvent($ctrlInner, event, timeout);
                        $ctrlInner.on(event, this._onEvent(that, _obj[event], item))
                    }
                }
            }
        }
    });
    $.extend(_pq.pqToolbar.prototype, {
        getInner: function($ctrl, label, type) {
            var ctrl = $ctrl[0];
            return ctrl.nodeName.toUpperCase() === "LABEL" ? $(ctrl.children[0]) : $ctrl
        },
        refresh: function() {
            this.element.empty();
            this._create()
        },
        _onEvent: function(that, cb, item) {
            return function(evt) {
                if (item.type === "checkbox") {
                    item.value = $(evt.target).prop("checked")
                } else {
                    item.value = $(evt.target).val()
                }
                cb.call(that, evt)
            }
        },
        _destroy: function() {
            this.element.empty().removeClass("pq-toolbar").enableSelection()
        },
        _disable: function() {
            if (this.$disable === null) this.$disable = $("<div class='pq-grid-disable'></div>").css("opacity", .2).appendTo(this.element)
        },
        _enable: function() {
            if (this.$disable) {
                this.element[0].removeChild(this.$disable[0]);
                this.$disable = null
            }
        },
        _setOption: function(key, value) {
            if (key === "disabled") {
                if (value === true) {
                    this._disable()
                } else {
                    this._enable()
                }
            }
        }
    });
    pq.toolbar = function(selector, options) {
        var $p = $(selector).pqToolbar(options),
            p = $p.data("paramqueryPqToolbar") || $p.data("paramquery-pqToolbar");
        return p
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        fnGrid = _pq.pqGrid.prototype;
    fnGrid.options.trackModel = {
        on: false,
        dirtyClass: "pq-cell-dirty"
    };
    _pq.cUCData = function(that) {
        this.that = that;
        this.udata = [];
        this.ddata = [];
        this.adata = [];
        this.options = that.options;
        that.on("dataAvailable", this.onDA(this))
    };
    _pq.cUCData.prototype = {
        add: function(obj) {
            var that = this.that,
                adata = this.adata,
                ddata = this.ddata,
                rowData = obj.rowData,
                TM = this.options.trackModel,
                dirtyClass = TM.dirtyClass,
                recId = that.getRecId({
                    rowData: rowData
                });
            for (var i = 0, len = adata.length; i < len; i++) {
                var rec = adata[i];
                if (recId !== null && rec.recId === recId) {
                    throw "primary key violation"
                }
                if (rec.rowData === rowData) {
                    throw "same data can't be added twice."
                }
            }
            for (var i = 0, len = ddata.length; i < len; i++) {
                if (rowData === ddata[i].rowData) {
                    ddata.splice(i, 1);
                    return
                }
            }
            var dataIndxs = [];
            for (var dataIndx in rowData) {
                dataIndxs.push(dataIndx)
            }
            that.removeClass({
                rowData: rowData,
                dataIndx: dataIndxs,
                cls: dirtyClass
            });
            var obj = {
                recId: recId,
                rowData: rowData
            };
            adata.push(obj)
        },
        commit: function(objP) {
            var that = this.that;
            if (objP === null) {
                this.commitAddAll();
                this.commitUpdateAll();
                this.commitDeleteAll()
            } else {
                var history = objP.history,
                    DM = that.options.dataModel,
                    updateList = [],
                    recIndx = DM.recIndx,
                    objType = objP.type,
                    rows = objP.rows;
                history = history === null ? false : history;
                if (objType === "add") {
                    if (rows) {
                        updateList = this.commitAdd(rows, recIndx)
                    } else {
                        this.commitAddAll()
                    }
                } else if (objType === "update") {
                    if (rows) {
                        this.commitUpdate(rows, recIndx)
                    } else {
                        this.commitUpdateAll()
                    }
                } else if (objType === "delete") {
                    if (rows) {
                        this.commitDelete(rows, recIndx)
                    } else {
                        this.commitDeleteAll()
                    }
                }
                if (updateList.length) {
                    that._digestData({
                        source: "commit",
                        checkEditable: false,
                        track: false,
                        history: history,
                        updateList: updateList
                    });
                    that.refreshView({
                        header: false
                    })
                }
            }
        },
        commitAdd: function(rows, recIndx) {
            var that = this.that,
                i, j, k, rowData, row, CM = that.colModel,
                CMLength = CM.length,
                adata = this.adata,
                inArray = $.inArray,
                adataLen = adata.length,
                getVal = that.getValueFromDataType,
                updateList = [],
                rowLen = rows.length,
                _found, foundRowData = [];
            for (j = 0; j < rowLen; j++) {
                row = rows[j];
                for (i = 0; i < adataLen; i++) {
                    rowData = adata[i].rowData;
                    _found = true;
                    if (inArray(rowData, foundRowData) === -1) {
                        for (k = 0; k < CMLength; k++) {
                            var column = CM[k],
                                dataType = column.dataType,
                                dataIndx = column.dataIndx;
                            if (column.hidden || dataIndx === recIndx) {
                                continue
                            }
                            var cellData = rowData[dataIndx],
                                cellData = getVal(cellData, dataType),
                                cell = row[dataIndx],
                                cell = getVal(cell, dataType);
                            if (cellData !== cell) {
                                _found = false;
                                break
                            }
                        }
                        if (_found) {
                            var newRow = {},
                                oldRow = {};
                            newRow[recIndx] = row[recIndx];
                            oldRow[recIndx] = rowData[recIndx];
                            updateList.push({
                                rowData: rowData,
                                oldRow: oldRow,
                                newRow: newRow
                            });
                            foundRowData.push(rowData);
                            break
                        }
                    }
                }
            }
            var remain_adata = [];
            for (i = 0; i < adataLen; i++) {
                rowData = adata[i].rowData;
                if (inArray(rowData, foundRowData) === -1) {
                    remain_adata.push(adata[i])
                }
            }
            this.adata = remain_adata;
            return updateList
        },
        commitDelete: function(rows, recIndx) {
            var ddata = this.ddata,
                i = ddata.length,
                udata = this.udata,
                rowData, recId, j, k;
            while (i--) {
                rowData = ddata[i].rowData;
                recId = rowData[recIndx];
                j = rows.length;
                if (!j) {
                    break
                }
                while (j--) {
                    if (recId === rows[j][recIndx]) {
                        rows.splice(j, 1);
                        ddata.splice(i, 1);
                        k = udata.length;
                        while (k--) {
                            if (udata[k].rowData === rowData) {
                                udata.splice(k, 1)
                            }
                        }
                        break
                    }
                }
            }
        },
        commitUpdate: function(rows, recIndx) {
            var that = this.that,
                i, j, dirtyClass = this.options.trackModel.dirtyClass,
                udata = this.udata,
                udataLen = udata.length,
                rowLen = rows.length,
                foundRowData = [];
            for (i = 0; i < udataLen; i++) {
                var rec = udata[i],
                    rowData = rec.rowData,
                    oldRow = rec.oldRow;
                if ($.inArray(rowData, foundRowData) !== -1) {
                    continue
                }
                for (j = 0; j < rowLen; j++) {
                    var row = rows[j];
                    if (rowData[recIndx] === row[recIndx]) {
                        foundRowData.push(rowData);
                        for (var dataIndx in oldRow) {
                            that.removeClass({
                                rowData: rowData,
                                dataIndx: dataIndx,
                                cls: dirtyClass
                            })
                        }
                    }
                }
            }
            var newudata = [];
            for (i = 0; i < udataLen; i++) {
                rowData = udata[i].rowData;
                if ($.inArray(rowData, foundRowData) === -1) {
                    newudata.push(udata[i])
                }
            }
            this.udata = newudata
        },
        commitAddAll: function() {
            this.adata = []
        },
        commitDeleteAll: function() {
            var ddata = this.ddata,
                udata = this.udata,
                j = udata.length,
                rowData, ddataLen = ddata.length;
            for (var i = 0; j > 0 && i < ddataLen; i++) {
                rowData = ddata[i].rowData;
                while (j--) {
                    if (udata[j].rowData === rowData) {
                        udata.splice(j, 1)
                    }
                }
                j = udata.length
            }
            ddata.length = 0
        },
        commitUpdateAll: function() {
            var that = this.that,
                dirtyClass = this.options.trackModel.dirtyClass,
                udata = this.udata;
            for (var i = 0, len = udata.length; i < len; i++) {
                var rec = udata[i],
                    row = rec.oldRow,
                    rowData = rec.rowData;
                for (var dataIndx in row) {
                    that.removeClass({
                        rowData: rowData,
                        dataIndx: dataIndx,
                        cls: dirtyClass
                    })
                }
            }
            this.udata = []
        },
        "delete": function(obj) {
            var that = this.that,
                rowIndx = obj.rowIndx,
                rowIndxPage = obj.rowIndxPage,
                offset = that.riOffset,
                rowIndx = rowIndx === null ? rowIndxPage + offset : rowIndx,
                rowIndxPage = rowIndxPage === null ? rowIndx - offset : rowIndxPage,
                paging = that.options.pageModel.type,
                indx = paging === "remote" ? rowIndxPage : rowIndx,
                adata = this.adata,
                ddata = this.ddata,
                rowData = that.getRowData(obj);
            for (var i = 0, len = adata.length; i < len; i++) {
                if (adata[i].rowData === rowData) {
                    adata.splice(i, 1);
                    return
                }
            }
            ddata.push({
                indx: indx,
                rowData: rowData,
                rowIndx: rowIndx
            })
        },
        getChangesValue: function(ui) {
            ui = ui || {};
            var that = this.that,
                all = ui.all,
                udata = this.udata,
                adata = this.adata,
                ddata = this.ddata,
                mupdateList = [],
                updateList = [],
                oldList = [],
                addList = [],
                mdeleteList = [],
                deleteList = [];
            for (var i = 0, len = ddata.length; i < len; i++) {
                var rec = ddata[i],
                    rowData = rec.rowData,
                    row = {};
                mdeleteList.push(rowData);
                for (var key in rowData) {
                    if (key.indexOf("pq_") !== 0) {
                        row[key] = rowData[key]
                    }
                }
                deleteList.push(row)
            }
            for (var i = 0, len = udata.length; i < len; i++) {
                var rec = udata[i],
                    oldRow = rec.oldRow,
                    rowData = rec.rowData;
                if ($.inArray(rowData, mdeleteList) !== -1) {
                    continue
                }
                if ($.inArray(rowData, mupdateList) === -1) {
                    var row = {};
                    if (all !== false) {
                        for (var key in rowData) {
                            if (key.indexOf("pq_") !== 0) {
                                row[key] = rowData[key]
                            }
                        }
                    } else {
                        for (var key in oldRow) {
                            row[key] = rowData[key]
                        }
                        row[that.options.dataModel.recIndx] = rec.recId
                    }
                    mupdateList.push(rowData);
                    updateList.push(row);
                    oldList.push(oldRow)
                }
            }
            for (var i = 0, len = adata.length; i < len; i++) {
                var rec = adata[i],
                    rowData = rec.rowData,
                    row = {};
                for (var key in rowData) {
                    if (key.indexOf("pq_") !== 0) {
                        row[key] = rowData[key]
                    }
                }
                addList.push(row)
            }
            return {
                updateList: updateList,
                addList: addList,
                deleteList: deleteList,
                oldList: oldList
            }
        },
        getChanges: function() {
            var that = this.that,
                udata = this.udata,
                adata = this.adata,
                ddata = this.ddata,
                inArray = $.inArray,
                updateList = [],
                oldList = [],
                addList = [],
                deleteList = [];
            for (var i = 0, len = ddata.length; i < len; i++) {
                var rec = ddata[i],
                    rowData = rec.rowData;
                deleteList.push(rowData)
            }
            for (var i = 0, len = udata.length; i < len; i++) {
                var rec = udata[i],
                    oldRow = rec.oldRow,
                    rowData = rec.rowData;
                if (inArray(rowData, deleteList) !== -1) {
                    continue
                }
                if (inArray(rowData, updateList) === -1) {
                    updateList.push(rowData);
                    oldList.push(oldRow)
                }
            }
            for (var i = 0, len = adata.length; i < len; i++) {
                var rec = adata[i],
                    rowData = rec.rowData;
                addList.push(rowData)
            }
            return {
                updateList: updateList,
                addList: addList,
                deleteList: deleteList,
                oldList: oldList
            }
        },
        getChangesRaw: function() {
            var that = this.that,
                udata = this.udata,
                adata = this.adata,
                ddata = this.ddata,
                mydata = {
                    updateList: [],
                    addList: [],
                    deleteList: []
                };
            mydata["updateList"] = udata;
            mydata["addList"] = adata;
            mydata["deleteList"] = ddata;
            return mydata
        },
        isDirty: function(ui) {
            var that = this.that,
                udata = this.udata,
                adata = this.adata,
                ddata = this.ddata,
                dirty = false,
                rowData = that.getRowData(ui);
            if (rowData) {
                for (var i = 0; i < udata.length; i++) {
                    var rec = udata[i];
                    if (rowData === rec.rowData) {
                        dirty = true;
                        break
                    }
                }
            } else if (udata.length || adata.length || ddata.length) {
                dirty = true
            }
            return dirty
        },
        onDA: function(self) {
            return function(evt, ui) {
                if (ui.source !== "filter") {
                    self.udata = [];
                    self.ddata = [];
                    self.adata = []
                }
            }
        },
        rollbackAdd: function(PM, data) {
            var adata = this.adata,
                rowList = [],
                paging = PM.type;
            for (var i = 0, len = adata.length; i < len; i++) {
                var rec = adata[i],
                    rowData = rec.rowData;
                rowList.push({
                    type: "delete",
                    rowData: rowData
                })
            }
            this.adata = [];
            return rowList
        },
        rollbackDelete: function(PM, data) {
            var ddata = this.ddata,
                rowList = [],
                paging = PM.type;
            for (var i = ddata.length - 1; i >= 0; i--) {
                var rec = ddata[i],
                    indx = rec.indx,
                    rowIndx = rec.rowIndx,
                    rowData = rec.rowData;
                rowList.push({
                    type: "add",
                    rowIndx: rowIndx,
                    newRow: rowData
                })
            }
            this.ddata = [];
            return rowList
        },
        rollbackUpdate: function(PM, data) {
            var that = this.that,
                dirtyClass = this.options.trackModel.dirtyClass,
                udata = this.udata,
                rowList = [];
            for (var i = 0, len = udata.length; i < len; i++) {
                var rec = udata[i],
                    recId = rec.recId,
                    rowData = rec.rowData,
                    oldRow = {},
                    newRow = rec.oldRow;
                if (recId === null) {
                    continue
                }
                var dataIndxs = [];
                for (var dataIndx in newRow) {
                    oldRow[dataIndx] = rowData[dataIndx];
                    dataIndxs.push(dataIndx)
                }
                that.removeClass({
                    rowData: rowData,
                    dataIndx: dataIndxs,
                    cls: dirtyClass,
                    refresh: false
                });
                rowList.push({
                    type: "update",
                    rowData: rowData,
                    newRow: newRow,
                    oldRow: oldRow
                })
            }
            this.udata = [];
            return rowList
        },
        rollback: function(objP) {
            var that = this.that,
                DM = that.options.dataModel,
                PM = that.options.pageModel,
                refreshView = objP && objP.refresh !== null ? objP.refresh : true,
                objType = objP && objP.type !== null ? objP.type : null,
                rowListAdd = [],
                rowListUpdate = [],
                rowListDelete = [],
                data = DM.data;
            if (objType === null || objType === "update") {
                rowListUpdate = this.rollbackUpdate(PM, data)
            }
            if (objType === null || objType === "delete") {
                rowListAdd = this.rollbackDelete(PM, data)
            }
            if (objType === null || objType === "add") {
                rowListDelete = this.rollbackAdd(PM, data)
            }
            that._digestData({
                history: false,
                allowInvalid: true,
                checkEditable: false,
                source: "rollback",
                track: false,
                addList: rowListAdd,
                updateList: rowListUpdate,
                deleteList: rowListDelete
            });
            if (refreshView) {
                that.refreshView({
                    header: false
                })
            }
        },
        update: function(objP) {
            var that = this.that,
                TM = this.options.trackModel,
                dirtyClass = TM.dirtyClass,
                rowData = objP.rowData || that.getRowData(objP),
                recId = that.getRecId({
                    rowData: rowData
                }),
                dataIndx = objP.dataIndx,
                refresh = objP.refresh,
                columns = that.columns,
                getVal = that.getValueFromDataType,
                newRow = objP.row,
                udata = this.udata,
                newudata = udata.slice(0),
                _found = false;
            if (recId === null) {
                return
            }
            for (var i = 0, len = udata.length; i < len; i++) {
                var rec = udata[i],
                    oldRow = rec.oldRow;
                if (rec.rowData === rowData) {
                    _found = true;
                    for (var dataIndx in newRow) {
                        var column = columns[dataIndx],
                            dataType = column.dataType,
                            newVal = newRow[dataIndx],
                            newVal = getVal(newVal, dataType),
                            oldVal = oldRow[dataIndx],
                            oldVal = getVal(oldVal, dataType);
                        if (oldRow.hasOwnProperty(dataIndx) && oldVal === newVal) {
                            var obj = {
                                rowData: rowData,
                                dataIndx: dataIndx,
                                refresh: refresh,
                                cls: dirtyClass
                            };
                            that.removeClass(obj);
                            delete oldRow[dataIndx]
                        } else {
                            var obj = {
                                rowData: rowData,
                                dataIndx: dataIndx,
                                refresh: refresh,
                                cls: dirtyClass
                            };
                            that.addClass(obj);
                            if (!oldRow.hasOwnProperty(dataIndx)) {
                                oldRow[dataIndx] = rowData[dataIndx]
                            }
                        }
                    }
                    if ($.isEmptyObject(oldRow)) {
                        newudata.splice(i, 1)
                    }
                    break
                }
            }
            if (!_found) {
                var oldRow = {};
                for (var dataIndx in newRow) {
                    oldRow[dataIndx] = rowData[dataIndx];
                    var obj = {
                        rowData: rowData,
                        dataIndx: dataIndx,
                        refresh: refresh,
                        cls: dirtyClass
                    };
                    that.addClass(obj)
                }
                var obj = {
                    rowData: rowData,
                    recId: recId,
                    oldRow: oldRow
                };
                newudata.push(obj)
            }
            this.udata = newudata
        }
    };
    fnGrid.getChanges = function(obj) {
        this.blurEditor({
            force: true
        });
        if (obj) {
            var format = obj.format;
            if (format) {
                if (format === "byVal") {
                    return this.iUCData.getChangesValue(obj)
                } else if (format === "raw") {
                    return this.iUCData.getChangesRaw()
                }
            }
        }
        return this.iUCData.getChanges()
    };
    fnGrid.rollback = function(obj) {
        this.blurEditor({
            force: true
        });
        this.iUCData.rollback(obj)
    };
    fnGrid.isDirty = function(ui) {
        return this.iUCData.isDirty(ui)
    };
    fnGrid.commit = function(obj) {
        this.iUCData.commit(obj)
    };
    fnGrid.updateRow = function(ui) {
        var that = this,
            len, rowList = ui.rowList || [{
                rowIndx: ui.rowIndx,
                newRow: ui.newRow || ui.row,
                rowData: ui.rowData,
                rowIndxPage: ui.rowIndxPage
            }],
            rowListNew = [];
        that.normalizeList(rowList).forEach(function(rlObj) {
            var newRow = rlObj.newRow,
                rowData = rlObj.rowData,
                dataIndx, oldRow = rlObj.oldRow = {};
            if (rowData) {
                for (dataIndx in newRow) {
                    oldRow[dataIndx] = rowData[dataIndx]
                }
                rowListNew.push(rlObj)
            }
        });
        if (rowListNew.length) {
            var uid = {
                    source: ui.source || "update",
                    history: ui.history,
                    checkEditable: ui.checkEditable,
                    track: ui.track,
                    allowInvalid: ui.allowInvalid,
                    updateList: rowListNew
                },
                ret = this._digestData(uid);
            if (ret === false) {
                return false
            }
            if (ui.refresh !== false) {
                rowListNew = uid.updateList;
                len = rowListNew.length;
                if (len > 1) {
                    that.refresh({
                        header: false
                    })
                } else if (len === 1) {
                    that.refreshRow({
                        rowIndx: rowListNew[0].rowIndx
                    })
                }
            }
        }
    };
    fnGrid.getRecId = function(obj) {
        var that = this,
            DM = that.options.dataModel;
        obj.dataIndx = DM.recIndx;
        var recId = that.getCellData(obj);
        if (recId === null) {
            return null
        } else {
            return recId
        }
    };
    fnGrid.getCellData = function(obj) {
        var rowData = obj.rowData || this.getRowData(obj),
            dataIndx = obj.dataIndx;
        if (rowData) {
            return rowData[dataIndx]
        } else {
            return null
        }
    };
    fnGrid.getRowData = function(obj) {
        if (!obj) {
            return null
        }
        var objRowData = obj.rowData,
            recId;
        if (objRowData !== null) {
            return objRowData
        }
        recId = obj.recId;
        if (recId === null) {
            var rowIndx = obj.rowIndx,
                rowIndx = rowIndx !== null ? rowIndx : obj.rowIndxPage + this.riOffset,
                data = this.get_p_data(),
                rowData = data[rowIndx];
            return rowData
        } else {
            var options = this.options,
                DM = options.dataModel,
                recIndx = DM.recIndx,
                DMdata = DM.data;
            for (var i = 0, len = DMdata.length; i < len; i++) {
                var rowData = DMdata[i];
                if (rowData[recIndx] === recId) {
                    return rowData
                }
            }
        }
        return null
    };
    fnGrid.addNodes = function(nodes, ri) {
        ri = ri === null ? this.options.dataModel.data.length : ri;
        this._digestData({
            addList: nodes.map(function(rd) {
                return {
                    rowIndx: ri++,
                    newRow: rd
                }
            }),
            source: "addNodes"
        });
        this.refreshView()
    };
    fnGrid.deleteNodes = function(nodes) {
        this._digestData({
            deleteList: nodes.map(function(rd) {
                return {
                    rowData: rd
                }
            }),
            source: "deleteNodes"
        });
        this.refreshView()
    };
    fnGrid.moveNodes = function(nodes, ri) {
        var self = this,
            o = self.options,
            riOffset = self.riOffset,
            data = o.dataModel.data;
        ri = ri === null ? data.length : ri;
        self._trigger("beforeMoveNode");
        nodes.forEach(function(node) {
            ri = pq.moveItem(node, data, data.indexOf(node), ri)
        });
        if (data !== self.pdata) {
            self.pdata = data.slice(riOffset, o.pageModel.rPP + riOffset)
        }
        self._trigger("moveNode");
        self.refresh()
    };
    fnGrid.deleteRow = function(ui) {
        var that = this,
            rowListNew = that.normalizeList(ui.rowList || [{
                rowIndx: ui.rowIndx,
                rowIndxPage: ui.rowIndxPage,
                rowData: ui.rowData
            }]);
        if (!rowListNew.length) {
            return false
        }
        this._digestData({
            source: ui.source || "delete",
            history: ui.history,
            track: ui.track,
            deleteList: rowListNew
        });
        if (ui.refresh !== false) {
            that.refreshView({
                header: false
            })
        }
    };
    fnGrid.addRow = function(ui) {
        var that = this,
            rowIndx, addList, offset = that.riOffset,
            DM = that.options.dataModel,
            data = DM.data = DM.data || [];
        ui.rowData && (ui.newRow = ui.rowData);
        ui.rowIndxPage !== null && (ui.rowIndx = ui.rowIndxPage + offset);
        addList = ui.rowList || [{
            rowIndx: ui.rowIndx,
            newRow: ui.newRow
        }];
        if (!addList.length || this._digestData({
                source: ui.source || "add",
                history: ui.history,
                track: ui.track,
                checkEditable: ui.checkEditable,
                addList: addList
            }) === false) {
            return false
        }
        if (ui.refresh !== false) {
            this.refreshView({
                header: false
            })
        }
        rowIndx = addList[0].rowIndx;
        return rowIndx === null ? data.length - 1 : rowIndx
    }
})(jQuery);
(function() {
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(fn) {
        return setTimeout(fn, 10)
    };
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || function(id) {
        clearTimeout(id)
    }
})();
(function($) {
    var _pq = $.paramquery;

    function cMouseSelection(that) {
        var self = this;
        self.that = that;
        that.on("mousePQUp", self.onMousePQUp.bind(self)).on("cellClick", self.onCellClick.bind(self)).on("cellMouseDown", self.onCellMouseDown.bind(self)).on("cellMouseEnter", self.onCellMouseEnter.bind(self)).on("refresh refreshRow", self.onRefresh.bind(self))
    }
    _pq.cMouseSelection = cMouseSelection;
    cMouseSelection.prototype = $.extend({
        onCellMouseDown: function(evt, ui) {
            if (evt.isDefaultPrevented()) {
                return
            }
            var that = this.that,
                rowIndx = ui.rowIndx,
                iSel = that.iSelection,
                colIndx = ui.colIndx,
                SM = that.options.selectionModel,
                type = SM.type,
                mode = SM.mode,
                last = iSel.addressLast();
            if (type !== "cell") {
                that.focus(ui);
                return
            }
            if (colIndx === null) {
                return
            } else if (colIndx === -1) {
                if (!SM.row) {
                    return
                }
                colIndx = undefined
            }
            if (evt.shiftKey && mode !== "single" && last && last.firstR !== null) {
                var r1 = last.firstR,
                    c1 = last.firstC;
                iSel.resizeOrReplace({
                    r1: r1,
                    c1: c1,
                    r2: rowIndx,
                    c2: colIndx,
                    firstR: r1,
                    firstC: c1
                })
            } else if (pq.isCtrl(evt) && mode !== "single") {
                this.mousedown = {
                    r1: rowIndx,
                    c1: colIndx
                };
                that.Selection().add({
                    r1: rowIndx,
                    c1: colIndx,
                    firstR: rowIndx,
                    firstC: colIndx
                })
            } else {
                this.mousedown = {
                    r1: rowIndx,
                    c1: colIndx
                };
                iSel.clearOther({
                    r1: rowIndx,
                    c1: colIndx
                });
                iSel.resizeOrReplace({
                    r1: rowIndx,
                    c1: colIndx,
                    firstR: rowIndx,
                    firstC: colIndx
                })
            }
            that.focus(ui);
            return true
        },
        onCellMouseEnter: function(evt, ui) {
            var that = this.that,
                SM = that.options.selectionModel,
                type = SM.type,
                mousedown = this.mousedown,
                mode = SM.mode;
            if (mousedown) {
                if (mode !== "single") {
                    if (type === "cell") {
                        var r1 = mousedown.r1,
                            c1 = mousedown.c1,
                            r2 = ui.rowIndx,
                            c2 = ui.colIndx,
                            iSel = that.Selection();
                        that.scrollCell({
                            rowIndx: r2,
                            colIndx: c2
                        });
                        iSel.resizeOrReplace({
                            r1: r1,
                            c1: c1,
                            r2: r2,
                            c2: c2
                        })
                    }
                    that.focus(ui)
                }
            }
        },
        onCellClick: function(evt, ui) {
            var that = this.that,
                SM = that.options.selectionModel,
                single = SM.mode === "single",
                toggle = SM.toggle,
                isSelected, iRows = that.iRows;
            if (SM.type === "row") {
                if (!SM.row && ui.colIndx === -1) {
                    return
                }
                isSelected = iRows.isSelected(ui);
                if ((!single || isSelected) && !toggle && pq.isCtrl(evt)) {
                    ui.isFirst = true;
                    iRows.toggle(ui)
                } else if (!single && evt.shiftKey) {
                    iRows.extend(ui)
                } else if (single && (!isSelected || !toggle)) {
                    if (!isSelected) {
                        iRows.replace(ui)
                    }
                } else {
                    ui.isFirst = true;
                    iRows[toggle ? "toggle" : "replace"](ui)
                }
            }
        },
        onMousePQUp: function() {
            this.mousedown = null
        },
        onRefresh: function() {
            var that = this.that;
            this.setTimer(function() {
                if (that.element) {
                    that.focus()
                }
            }, 300)
        }
    }, new _pq.cClass)
})(jQuery);
(function($) {
    var iExcel = null,
        pasteProgress = false,
        id_clip = "pq-grid-excel",
        _pq = $.paramquery,
        _pgrid = _pq.pqGrid.prototype;
    $.extend(_pgrid.options, {
        copyModel: {
            on: true,
            render: false,
            header: true,
            zIndex: 1e4
        },
        cutModel: {
            on: true
        },
        pasteModel: {
            on: true,
            compare: "byVal",
            select: true,
            validate: true,
            allowInvalid: true,
            type: "replace"
        }
    });
    $.extend(_pgrid, {
        _setGlobalStr: function(str) {
            cExcel.clip = str
        },
        canPaste: function() {
            return !!_pq.cExcel.clip
        },
        clearPaste: function() {
            _pq.cExcel.clip = ""
        },
        copy: function() {
            return this.iSelection.copy()
        },
        cut: function() {
            return this.iSelection.copy({
                cut: true,
                source: "cut"
            })
        },
        paste: function(ui) {
            iExcel = new cExcel(this);
            iExcel.paste(ui);
            iExcel = null
        },
        clear: function() {
            var iSel = this.iSelection;
            if (iSel.address().length) {
                iSel.clear()
            } else {
                this.iRows.toRange().clear()
            }
        }
    });
    var cExcel = _pq.cExcel = function(that, $ae) {
        this.that = that
    };
    cExcel.clip = "";
    cExcel.prototype = {
        createClipBoard: function() {
            var that = this.that,
                $div = $("#pq-grid-excel-div"),
                CPM = that.options.copyModel,
                $text = $("#" + id_clip);
            if ($text.length === 0) {
                $div = $("<div id='pq-grid-excel-div' " + " style='position:fixed;top:20px;left:20px;height:1px;width:1px;overflow:hidden;z-index:" + CPM.zIndex + ";'/>").appendTo(document.body);
                $text = $("<textarea id='" + id_clip + "' autocomplete='off' spellcheck='false'" + " style='overflow:hidden;height:10000px;width:10000px;opacity:0' />").appendTo($div);
                $text.css({
                    opacity: 0
                }).on("keyup", function(evt) {
                    if (pq.isCtrl(evt) && that.element) {
                        that._trigger("keyUp", evt)
                    }
                })
            }
            $text.on("focusin", function(evt) {
                evt.stopPropagation()
            });
            $text.select()
        },
        destroyClipBoard: function() {
            this.clearClipBoard();
            var that = this.that,
                pageTop = $(window).scrollTop(),
                pageLeft = $(window).scrollLeft();
            that.focus();
            var pageTop2 = $(window).scrollTop(),
                pageLeft2 = $(window).scrollLeft();
            if (pageTop !== pageTop2 || pageLeft !== pageLeft2) {
                window.scrollTo(pageLeft, pageTop)
            }
        },
        clearClipBoard: function() {
            var $text = $("#" + id_clip);
            $text.val("")
        },
        copy: function(ui) {
            var that = this.that,
                iSel = that.iSelection;
            if (iSel.address().length) {
                return iSel.copy(ui)
            } else {
                that.iRows.toRange().copy(ui)
            }
        },
        getRows: function(text) {
            text = text.replace(/\n$/, "");
            text = text.replace(/(^|\t|\n)"(?=[^\t]*?[\r\n])([^"]|"")*"(?=$|\t|\n)/g, function(a) {
                return a.replace(/(\r\n|\n)/g, "\r").replace(/^(\t|\n)?"/, "$1").replace(/"$/, "").replace(/""/g, '"')
            });
            return text.split("\n")
        },
        paste: function(ui) {
            ui = ui || {};
            var that = this.that,
                dest = ui.dest,
                clip = ui.clip,
                text = ui.text || (clip ? clip.length ? clip.val() : "" : cExcel.clip);
            var rows = this.getRows(text),
                rows_length = rows.length,
                CM = that.colModel,
                o = that.options,
                readCell = that.readCell,
                PSTM = o.pasteModel,
                SMType = "row",
                refreshView = false,
                CMLength = CM.length;
            if (!PSTM.on) {
                return
            }
            if (text.length === 0 || rows_length === 0) {
                return
            }
            for (var i = 0; i < rows_length; i++) {
                rows[i] = rows[i].split("	")
            }
            var PMtype = PSTM.type,
                selRowIndx, selColIndx, selEndRowIndx, selEndColIndx, iSel = dest ? that.Range(dest) : that.Selection(),
                _areas = iSel.address(),
                areas = _areas.length ? _areas : that.iRows.toRange().address(),
                area = areas[0],
                tui = {
                    rows: rows,
                    areas: [area]
                };
            if (that._trigger("beforePaste", null, tui) === false) {
                return false
            }
            if (area && that.getRowData({
                    rowIndx: area.r1
                })) {
                SMType = area.type === "row" ? "row" : "cell";
                selRowIndx = area.r1;
                selEndRowIndx = area.r2;
                selColIndx = area.c1;
                selEndColIndx = area.c2
            } else {
                SMType = "cell";
                selRowIndx = 0;
                selEndRowIndx = 0;
                selColIndx = 0;
                selEndColIndx = 0
            }
            var selRowIndx2, modeV;
            if (PMtype === "replace") {
                selRowIndx2 = selRowIndx;
                modeV = selEndRowIndx - selRowIndx + 1 < rows_length ? "extend" : "repeat"
            } else if (PMtype === "append") {
                selRowIndx2 = selEndRowIndx + 1;
                modeV = "extend"
            } else if (PMtype === "prepend") {
                selRowIndx2 = selRowIndx;
                modeV = "extend"
            }
            var modeH, lenV = modeV === "extend" ? rows_length : selEndRowIndx - selRowIndx + 1,
                lenH, lenHCopy;
            var ii = 0,
                addList = [],
                updateList = [],
                rowsAffected = 0;
            for (i = 0; i < lenV; i++) {
                var row = rows[ii],
                    rowIndx = i + selRowIndx2,
                    rowData = PMtype === "replace" ? that.getRowData({
                        rowIndx: rowIndx
                    }) : null,
                    oldRow = rowData ? {} : null,
                    newRow = {};
                if (row === undefined && modeV === "repeat") {
                    ii = 0;
                    row = rows[ii]
                }
                ii++;
                var cells = row,
                    cellsLength = cells.length;
                if (!lenH) {
                    if (SMType === "cell") {
                        modeH = selEndColIndx - selColIndx + 1 < cellsLength ? "extend" : "repeat";
                        lenH = modeH === "extend" ? cellsLength : selEndColIndx - selColIndx + 1;
                        if (isNaN(lenH)) {
                            throw "lenH NaN. assert failed."
                        }
                        if (lenH + selColIndx > CMLength) {
                            lenH = CMLength - selColIndx
                        }
                    } else {
                        lenH = CMLength;
                        selColIndx = 0
                    }
                }
                var jj = 0,
                    j = 0,
                    skipped = 0;
                lenHCopy = lenH;
                for (j = 0; j < lenHCopy; j++) {
                    if (jj >= cellsLength) {
                        jj = 0
                    }
                    var colIndx = j + selColIndx,
                        column = CM[colIndx],
                        cell = cells[jj],
                        dataIndx = column.dataIndx;
                    if (column.copy === false) {
                        skipped++;
                        if (modeH === "extend") {
                            if (lenHCopy + selColIndx < CMLength) {
                                lenHCopy++
                            }
                        }
                        continue
                    } else {
                        jj++;
                        newRow[dataIndx] = cell;
                        if (oldRow) {
                            oldRow[dataIndx] = readCell(rowData, column)
                        }
                    }
                }
                if ($.isEmptyObject(newRow) === false) {
                    if (rowData === null) {
                        refreshView = true;
                        addList.push({
                            newRow: newRow,
                            rowIndx: rowIndx
                        })
                    } else {
                        updateList.push({
                            newRow: newRow,
                            rowIndx: rowIndx,
                            rowData: rowData,
                            oldRow: oldRow
                        })
                    }
                    rowsAffected++
                }
            }
            var dui = {
                addList: addList,
                updateList: updateList,
                source: "paste",
                allowInvalid: PSTM.allowInvalid,
                validate: PSTM.validate
            };
            that._digestData(dui);
            that[refreshView ? "refreshView" : "refresh"]({
                header: false
            });
            if (PSTM.select) {
                that.Range({
                    r1: selRowIndx2,
                    c1: selColIndx,
                    r2: selRowIndx2 + rowsAffected - 1,
                    c2: modeH === "extend" ? selColIndx + lenH - 1 + skipped : selEndColIndx
                }).select()
            }
            that._trigger("paste", null, tui)
        }
    };
    $(document).unbind(".pqExcel").bind("keydown.pqExcel", function(evt) {
        if (pq.isCtrl(evt)) {
            var $ae = $(evt.target);
            if (!$ae.hasClass("pq-grid-cell") && !$ae.is("#" + id_clip) && !$ae.hasClass("pq-body-outer")) {
                return
            }
            var $grid = $ae.closest(".pq-grid"),
                that;
            if (iExcel || $ae.length && $grid.length) {
                if (!iExcel) {
                    try {
                        that = $grid.pqGrid("instance");
                        if (that.options.selectionModel.native) {
                            return true
                        }
                    } catch (ex) {
                        return true
                    }
                    iExcel = new cExcel(that, $ae);
                    iExcel.createClipBoard()
                }
                if (evt.keyCode === "67" || evt.keyCode === "99") {
                    iExcel.copy({
                        clip: $("#" + id_clip)
                    })
                } else if (evt.keyCode === "88") {
                    iExcel.copy({
                        cut: true,
                        clip: $("#" + id_clip)
                    })
                } else if (evt.keyCode === "86" || evt.keyCode === "118") {
                    pasteProgress = true;
                    iExcel.clearClipBoard();
                    window.setTimeout(function() {
                        if (iExcel) {
                            iExcel.paste({
                                clip: $("#" + id_clip)
                            });
                            iExcel.destroyClipBoard();
                            iExcel = null
                        }
                        pasteProgress = false
                    }, 3)
                } else {
                    var $text = $("#" + id_clip);
                    if ($text.length) {
                        var ae = document.activeElement;
                        if (ae === $text[0]) {
                            iExcel.that.onKeyPressDown(evt)
                        }
                    }
                }
            } else {}
        } else {
            var kc = evt.keyCode,
                KC = $.ui.keyCode,
                navKey = kc === KC.UP || kc === KC.DOWN || kc === KC.LEFT || kc === KC.RIGHT || kc === KC.PAGE_UP || kc === KC.PAGE_DOWN;
            if (navKey) {
                if (keyDownInGrid) {
                    return false
                }
                $ae = $(evt.target);
                if ($ae.hasClass("pq-grid-row") || $ae.hasClass("pq-grid-cell")) {
                    keyDownInGrid = true
                }
            }
        }
    }).bind("keyup.pqExcel", function(evt) {
        var keyCode = evt.keyCode;
        if (!pasteProgress && iExcel && !pq.isCtrl(evt) && $.inArray(keyCode, [17, 91, 93, 224]) !== -1) {
            iExcel.destroyClipBoard();
            iExcel = null
        }
        if (keyDownInGrid) {
            var $ae = $(evt.target);
            if (!$ae.hasClass("pq-grid-row") && !$ae.hasClass("pq-grid-cell")) {
                keyDownInGrid = false
            }
        }
    });
    var keyDownInGrid = false
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        pq_options = _pq.pqGrid.prototype.options,
        historyModel = {
            on: true,
            checkEditable: true,
            checkEditableAdd: false,
            allowInvalid: true
        };
    pq_options.historyModel = pq_options.historyModel || historyModel;
    var cHistory = _pq.cHistory = function(that) {
        var self = this;
        this.that = that;
        this.options = that.options;
        this.records = [];
        this.counter = 0;
        this.id = 0;
        that.on("keyDown", function(evt, ui) {
            return self.onKeyDown(evt, ui)
        }).on("dataAvailable", function(evt, ui) {
            if (ui.source !== "filter") {
                self.reset()
            }
        })
    };
    cHistory.prototype = {
        onKeyDown: function(evt, ui) {
            var keyCodes = {
                    z: "90",
                    y: "89",
                    c: "67",
                    v: "86"
                },
                ctrlMeta = pq.isCtrl(evt);
            if (ctrlMeta && evt.keyCode === keyCodes.z) {
                if (this.undo()) {}
                return false
            } else if (ctrlMeta && evt.keyCode === keyCodes.y) {
                if (this.redo()) {}
                return false
            }
        },
        resetUndo: function() {
            if (this.counter === 0) {
                return false
            }
            this.counter = 0;
            var that = this.that;
            that._trigger("history", null, {
                type: "resetUndo",
                num_undo: 0,
                num_redo: this.records.length - this.counter,
                canUndo: false,
                canRedo: true
            })
        },
        reset: function() {
            if (this.counter === 0 && this.records.length === 0) {
                return false
            }
            this.records = [];
            this.counter = 0;
            this.id = 0;
            var that = this.that;
            that._trigger("history", null, {
                num_undo: 0,
                num_redo: 0,
                type: "reset",
                canUndo: false,
                canRedo: false
            })
        },
        increment: function() {
            var records = this.records,
                len = records.length;
            if (len) {
                var id = records[len - 1].id;
                this.id = id + 1
            } else {
                this.id = 0
            }
        },
        push: function(objP) {
            var prevCanRedo = this.canRedo();
            var records = this.records,
                counter = this.counter;
            if (records.length > counter) {
                records.splice(counter, records.length - counter)
            }
            records[counter] = $.extend({
                id: this.id
            }, objP);
            this.counter++;
            var that = this.that,
                canUndo, canRedo;
            if (this.counter === 1) {
                canUndo = true
            }
            if (prevCanRedo && this.counter === records.length) {
                canRedo = false
            }
            that._trigger("history", null, {
                type: "add",
                canUndo: canUndo,
                canRedo: canRedo,
                num_undo: this.counter,
                num_redo: 0
            })
        },
        canUndo: function() {
            if (this.counter > 0) return true;
            else return false
        },
        canRedo: function() {
            if (this.counter < this.records.length) return true;
            else return false
        },
        processCol: function(colList, redo) {
            var that = this.that;
            if (colList.length) {
                var type_add = colList.type === "add",
                    type_add = redo ? type_add : !type_add;
                that[type_add ? "addColumn" : "deleteColumn"]({
                    colList: colList,
                    history: false
                })
            }
        },
        undo: function() {
            var prevCanRedo = this.canRedo(),
                that = this.that,
                HM = this.options.historyModel,
                records = this.records;
            if (this.counter > 0) {
                this.counter--
            } else {
                return false
            }
            var counter = this.counter,
                record = records[counter],
                colList = record.colList || [],
                canRedo, canUndo, id = record.id,
                updateList = record.updateList.map(function(rowListObj) {
                    return {
                        rowIndx: that.getRowIndx({
                            rowData: rowListObj.rowData
                        }).rowIndx,
                        rowData: rowListObj.rowData,
                        oldRow: rowListObj.newRow,
                        newRow: rowListObj.oldRow
                    }
                }),
                deleteList = record.addList.map(function(rowListObj) {
                    return {
                        rowData: rowListObj.newRow
                    }
                }),
                addList = record.deleteList.map(function(rowListObj) {
                    return {
                        newRow: rowListObj.rowData,
                        rowIndx: rowListObj.rowIndx
                    }
                });
            if (colList.length) {
                this.processCol(colList)
            } else {
                var ret = that._digestData({
                    history: false,
                    source: "undo",
                    checkEditable: HM.checkEditable,
                    checkEditableAdd: HM.checkEditableAdd,
                    allowInvalid: HM.allowInvalid,
                    addList: addList,
                    updateList: updateList,
                    deleteList: deleteList
                });
                that[addList.length || deleteList.length ? "refreshView" : "refresh"]({
                    source: "undo",
                    header: false
                })
            }
            if (prevCanRedo === false) {
                canRedo = true
            }
            if (this.counter === 0) {
                canUndo = false
            }
            that._trigger("history", null, {
                canUndo: canUndo,
                canRedo: canRedo,
                type: "undo",
                num_undo: this.counter,
                num_redo: this.records.length - this.counter
            });
            return true
        },
        redo: function() {
            var prevCanUndo = this.canUndo(),
                that = this.that,
                HM = this.options.historyModel,
                counter = this.counter,
                records = this.records;
            if (counter === records.length) {
                return false
            }
            var record = records[counter],
                colList = record.colList || [],
                id = record.id,
                updateList = record.updateList.map(function(rowListObj) {
                    return {
                        rowIndx: that.getRowIndx({
                            rowData: rowListObj.rowData
                        }).rowIndx,
                        rowData: rowListObj.rowData,
                        newRow: rowListObj.newRow,
                        oldRow: rowListObj.oldRow
                    }
                }),
                deleteList = record.deleteList.map(function(rowListObj) {
                    return {
                        rowData: rowListObj.rowData
                    }
                }),
                addList = record.addList.map(function(rowListObj) {
                    return {
                        newRow: rowListObj.newRow,
                        rowIndx: rowListObj.rowIndx
                    }
                });
            if (colList.length) {
                this.processCol(colList, true)
            } else {
                var ret = that._digestData({
                    history: false,
                    source: "redo",
                    checkEditable: HM.checkEditable,
                    checkEditableAdd: HM.checkEditableAdd,
                    allowInvalid: HM.allowInvalid,
                    addList: addList,
                    updateList: updateList,
                    deleteList: deleteList
                });
                that[addList.length || deleteList.length ? "refreshView" : "refresh"]({
                    source: "redo",
                    header: false
                })
            }
            if (this.counter < records.length) {
                this.counter++
            }
            var canUndo, canRedo;
            if (prevCanUndo === false) {
                canUndo = true
            }
            if (this.counter === this.records.length) {
                canRedo = false
            }
            that._trigger("history", null, {
                canUndo: canUndo,
                canRedo: canRedo,
                type: "redo",
                num_undo: this.counter,
                num_redo: this.records.length - this.counter
            });
            return true
        }
    };
    var fnGrid = _pq.pqGrid.prototype;
    fnGrid.history = function(obj) {
        var method = obj.method;
        return this.iHistory[method](obj)
    };
    fnGrid.History = function() {
        return this.iHistory
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    pq.filter = {
        dpBeforeShow: function(grid, di, i) {
            return function() {
                var gco = grid.getDataCascade(di),
                    min, max;
                if (gco.length) {
                    min = gco[0][di] === "" ? gco[1][di] : gco[0][di];
                    max = gco[gco.length - 1][di]
                }
                $(this).datepicker("option", "defaultDate", new Date(i === 1 ? max : min))
            }
        },
        datepicker: function(ui) {
            var column = ui.column,
                di = column.dataIndx,
                grid = this,
                filterUI = ui.filterUI,
                $editor = ui.$editor,
                dt = column.dataType,
                ui2 = {
                    dateFormat: filterUI.format || column.format,
                    changeYear: true,
                    changeMonth: true
                };
            if (dt === "date") {
                $editor.each(function(i, ele) {
                    var options = $.extend({}, ui2, i === 1 ? filterUI.dpOptions2 || filterUI.dpOptions : filterUI.dpOptions);
                    if (!options.defaultDate) {
                        options.beforeShow = options.beforeShow || pq.filter.dpBeforeShow(grid, di, i)
                    }
                    $(ele).datepicker(options)
                });
                return true
            }
        },
        filterFnEq: function(ui, grid) {
            var dt = (ui.column || {}).dataType;
            if (dt === "date") {
                return this.filterFnTD(ui, grid)
            } else if (dt === "bool") {
                return {
                    type: "checkbox"
                }
            } else {
                return $.extend({
                    maxCheck: 1
                }, this.filterFnSelect(ui, grid))
            }
        },
        filterFnSelect: function(ui, grid) {
            var di = ui.column.dataIndx,
                indx = ui.indx;
            return {
                type: "select",
                style: "padding-right:16px;cursor:default;",
                attr: "readonly",
                valueIndx: di,
                labelIndx: di,
                options: this.options,
                init: indx === 0 ? this.rangeInit.bind(grid) : function() {}
            }
        },
        filterFnT: function() {
            return {
                type: "textbox",
                attr: "autocomplete='off'"
            }
        },
        filterFnTD: function() {
            return {
                type: "textbox",
                attr: "autocomplete='off'",
                init: pq.filter.datepicker
            }
        },
        getVal: function(filter) {
            var crule0 = (filter.crules || [])[0] || {};
            return [crule0.value, crule0.value2, crule0.condition]
        },
        setVal: function(filter, val) {
            var crules = filter.crules = filter.crules || [];
            crules[0] = crules[0] || {};
            crules[0].value = val;
            return val
        }
    };
    $.extend(pq.filter, {
        conditions: {
            begin: {
                string: 1,
                numberList: 1,
                dateList: 1,
                filterFn: pq.filter.filterFnT
            },
            between: {
                stringList: 1,
                date: 1,
                number: 1,
                filter: {
                    attr: "autocomplete='off'",
                    type: "textbox2",
                    init: pq.filter.datepicker
                }
            },
            contain: {
                string: 1,
                numberList: 1,
                dateList: 1,
                filterFn: pq.filter.filterFnT
            },
            equal: {
                string: 1,
                bool: 1,
                date: 1,
                number: 1,
                filterFn: pq.filter.filterFnEq
            },
            empty: {
                string: 1,
                bool: 1,
                date: 1,
                number: 1,
                nr: 1
            },
            end: {
                string: 1,
                numberList: 1,
                dateList: 1,
                filterFn: pq.filter.filterFnT
            },
            great: {
                stringList: 1,
                number: 1,
                date: 1,
                filterFn: pq.filter.filterFnTD
            },
            gte: {
                stringList: 1,
                number: 1,
                date: 1,
                filterFn: pq.filter.filterFnTD
            },
            less: {
                stringList: 1,
                number: 1,
                date: 1,
                filterFn: pq.filter.filterFnTD
            },
            lte: {
                stringList: 1,
                number: 1,
                date: 1,
                filterFn: pq.filter.filterFnTD
            },
            notbegin: {
                string: 1,
                numberList: 1,
                dateList: 1,
                filterFn: pq.filter.filterFnT
            },
            notcontain: {
                string: 1,
                numberList: 1,
                dateList: 1,
                filterFn: pq.filter.filterFnT
            },
            notequal: {
                string: 1,
                date: 1,
                number: 1,
                bool: 1,
                filterFn: pq.filter.filterFnEq
            },
            notempty: {
                string: 1,
                bool: 1,
                date: 1,
                number: 1,
                nr: 1
            },
            notend: {
                string: 1,
                numberList: 1,
                dateList: 1,
                filterFn: pq.filter.filterFnT
            },
            range: {
                cascade: 1,
                string: 1,
                number: 1,
                date: 1,
                bool: 1,
                filterFn: pq.filter.filterFnSelect
            },
            regexp: {
                string: 1,
                numberList: 1,
                dateList: 1,
                filterFn: pq.filter.filterFnT
            }
        },
        getConditionsCol: function(column, filterUI) {
            var list = filterUI.conditionList || function(self) {
                    var list = self.getConditionsDT(pq.getDataType(column));
                    list.sort();
                    return list
                }(this),
                exclude = filterUI.conditionExclude,
                obj = {};
            if (exclude) {
                exclude.forEach(function(val) {
                    obj[val] = 1
                });
                list = list.filter(function(val) {
                    return !obj[val]
                })
            }
            return list
        },
        getConditionsDT: function(dt) {
            var arr = [],
                key, conditions = this.conditions,
                obj, d;
            for (key in conditions) {
                obj = conditions[key];
                d = obj[dt + "List"];
                if (obj[dt] && d !== 0 || d) arr.push(key)
            }
            return arr
        },
        getFilterUI: function(ui, grid) {
            var column = ui.column,
                filterFn = column.filterFn,
                filter = (ui.indx === 0 ? column.filter : {}) || {},
                obj = this.conditions[ui.condition] || {},
                _filterFn = obj.filterFn,
                _filter = obj.filter || {};
            delete filter.type;
            filterFn = filterFn ? filterFn.call(grid, ui) || {} : {};
            _filterFn = _filterFn ? _filterFn.call(this, ui, grid) || {} : {};
            var filterUI = $.extend({}, _filter, _filterFn, filter, filterFn);
            filterUI.condition = ui.condition;
            filterUI.init = [];
            filterUI.options = [];
            [filterFn, filter, _filterFn, _filter].forEach(function(f) {
                if (f.init) filterUI.init.push(f.init);
                if (f.options) filterUI.options.push(f.options)
            });
            return filterUI
        },
        options: function(ui) {
            var col = ui.column,
                f = ui.filterUI,
                diG = f.groupIndx,
                di = col.dataIndx;
            return this.getDataCascade(di, diG, f.diExtra)
        },
        getOptions: function(col, filterUI, grid) {
            var options = filterUI.options,
                di = col.dataIndx,
                ui = {
                    column: col,
                    dataIndx: di,
                    filterUI: filterUI,
                    condition: filterUI.condition
                },
                i = 0,
                len = options.length,
                o, opt;
            for (; i < len; i++) {
                o = options[i];
                if (o) {
                    opt = typeof o === "function" ? o.call(grid, ui) : o;
                    if (opt) {
                        opt = grid.getPlainOptions(opt, di);
                        opt = grid.removeNullOptions(opt, filterUI.dataIndx || di, filterUI.groupIndx);
                        return opt
                    }
                }
            }
            return []
        },
        rangeInit: function(ui) {
            var grid = this,
                column = ui.column,
                $editor = ui.$editor,
                headMenu = ui.headMenu,
                filterUI = ui.filterUI;
            if (!headMenu) {
                $editor.parent().off("click keydown").on("click keydown", function(evt) {
                    if (evt.type === "keydown" && evt.keyCode !== $.ui.keyCode.DOWN) {
                        return
                    }
                    var id = grid.uuid + "_" + column.dataIndx;
                    if (!$("#" + id).length) {
                        var i = new pq.cFilterMenu.select(grid, column),
                            $div = $("<div id='" + id + "' style='width:270px;' class='pq-theme'><div></div></div>").appendTo(document.body),
                            $grid = $div.children();
                        pq.makePopup($div[0], $editor);
                        i.create($grid, filterUI);
                        $div.position({
                            my: "left top",
                            at: "left bottom",
                            of: ui.$editor
                        })
                    }
                })
            }
        },
        getType: function(condition, column) {
            var obj = this.conditions[condition] || {},
                filterFn = obj.filterFn,
                _filter = obj.filter || {};
            return _filter.type || (filterFn ? filterFn.call(this, {
                condition: condition,
                column: column
            }) : {}).type
        }
    });
    var cFilterData = function(that) {
        var self = this;
        self.that = that;
        that.on("load", self.onLoad.bind(self)).on("filter clearFilter", self.onFilterChange.bind(self))
    };
    _pq.cFilterData = cFilterData;
    var cFc = cFilterData.conditions = {
        equal: function(cd, value) {
            if (cd === value) {
                return true
            }
        },
        notequal: function(cd, value) {
            return !cFc.equal(cd, value)
        },
        contain: function(cd, value) {
            if ((cd + "").indexOf(value) !== -1) {
                return true
            }
        },
        notcontain: function(cd, value) {
            return !cFc.contain(cd, value)
        },
        empty: function(cd) {
            if (cd.length === 0) {
                return true
            }
        },
        notempty: function(cd) {
            return !cFc.empty(cd)
        },
        begin: function(cd, value) {
            if ((cd + "").indexOf(value) === 0) {
                return true
            }
        },
        notbegin: function(cd, value) {
            return !cFc.begin(cd, value)
        },
        end: function(cd, value) {
            cd = cd + "";
            value = value + "";
            var lastIndx = cd.lastIndexOf(value);
            if (lastIndx !== -1 && lastIndx + value.length === cd.length) {
                return true
            }
        },
        notend: function(cd, value) {
            return !cFc.end(cd, value)
        },
        regexp: function(cd, value) {
            if (value.test(cd)) {
                value.lastIndex = 0;
                return true
            }
        },
        great: function(cd, value) {
            if (cd > value) {
                return true
            }
        },
        gte: function(cd, value) {
            if (cd >= value) {
                return true
            }
        },
        between: function(cd, value, value2) {
            if (cd >= value && cd <= value2) {
                return true
            }
        },
        range: function(cd, value) {
            if ($.inArray(cd, value) !== -1) {
                return true
            }
        },
        less: function(cd, value) {
            if (cd < value) {
                return true
            }
        },
        lte: function(cd, value) {
            if (cd <= value) {
                return true
            }
        }
    };
    cFilterData.convert = function(cd, dataType) {
        if (cd === null || cd === "") {
            return ""
        } else if (dataType === "string") {
            cd = (cd + "").trim().toUpperCase()
        } else if (dataType === "date") {
            cd = Date.parse(cd)
        } else if (dataType === "number") {
            if (cd * 1 === cd) {
                cd = cd * 1
            }
        } else if (dataType === "bool") {
            cd = String(cd).toLowerCase()
        }
        return cd
    };
    cFilterData.convertEx = function(cd, dt, condition, column) {
        var dt2 = pq.getDataType({
                dataType: dt
            }),
            _f = pq.filter.conditions[condition],
            f = _f[dt2];
        if (f) {
            return this.convert(cd, dt2)
        } else {
            if (_f.string) {
                if (column) {
                    cd = pq.format(column, cd)
                }
                return condition === "regexp" ? cd : this.convert(cd, "string")
            } else if (_f.number) {
                return this.convert(cd, "number")
            }
        }
    };
    cFilterData.prototype = {
        addMissingConditions: function(rules) {
            var that = this.that;
            rules.forEach(function(rule) {
                var filter = that.getColumn({
                    dataIndx: rule.dataIndx
                }).filter || {};
                rule.condition = rule.condition === undefined ? pq.filter.getVal(filter)[2] : rule.condition
            })
        },
        clearFilters: function(CM) {
            CM.forEach(function(column) {
                var filter = column.filter,
                    conds = pq.filter.conditions;
                if (filter) {
                    (filter.crules || []).forEach(function(crule) {
                        if ((conds[crule.condition] || {}).nr) {
                            crule.condition = undefined
                        }
                        crule.value = crule.value2 = undefined
                    })
                }
            })
        },
        compatibilityCheck: function(ui) {
            var data = ui.data,
                rule, str = "Incorrect filter parameters. Please check upgrade guide";
            if (data) {
                if (rule = data[0]) {
                    if (rule.hasOwnProperty("dataIndx") && rule.hasOwnProperty("value")) {
                        throw str
                    }
                } else if (!ui.rules) {
                    throw str
                }
            }
        },
        copyRuleToColumn: function(rule, column, oper) {
            var filter = column.filter = column.filter || {},
                crules = rule.crules || [],
                crule0 = crules[0],
                condition = crule0 ? crule0.condition : rule.condition,
                value = crule0 ? crule0.value : rule.value,
                value2 = crule0 ? crule0.value2 : rule.value2;
            if (oper === "remove") {
                filter.on = false;
                if (condition) {
                    filter.crules = [{
                        condition: condition,
                        value: condition === "range" ? [] : undefined
                    }]
                } else {
                    filter.crules = undefined
                }
            } else {
                filter.on = true;
                filter.mode = rule.mode;
                filter.crules = crule0 ? crules : [{
                    condition: condition,
                    value: value,
                    value2: value2
                }]
            }
        },
        filter: function(objP) {
            objP = objP || {};
            this.compatibilityCheck(objP);
            var that = this.that,
                o = that.options,
                header = false,
                data = objP.data,
                rules = objP.rules = objP.rules || (objP.rule ? [objP.rule] : []),
                rule, column, apply = !data,
                DM = o.dataModel,
                FM = o.filterModel,
                mode = objP.mode || FM.mode,
                oper = objP.oper,
                replace = oper === "replace",
                CM = apply ? that.colModel : this.getCMFromRules(rules),
                j = 0,
                rulesLength = rules.length;
            if (oper !== "remove") this.addMissingConditions(rules);
            if (apply) {
                if (that._trigger("beforeFilter", null, objP) === false) {
                    return
                }
                objP.header !== null && (header = objP.header);
                if (replace) {
                    this.clearFilters(CM)
                }
                for (; j < rulesLength; j++) {
                    rule = rules[j];
                    column = that.getColumn({
                        dataIndx: rule.dataIndx
                    });
                    this.copyRuleToColumn(rule, column, oper)
                }
            } else {
                for (; j < rulesLength; j++) {
                    rule = rules[j];
                    column = CM[j];
                    this.copyRuleToColumn(rule, column)
                }
            }
            var obj2 = {
                header: header,
                CM: CM,
                data: data,
                rules: rules,
                mode: mode
            };
            if (DM.location === "remote" && FM.type !== "local") {
                that.remoteRequest({
                    apply: apply,
                    CM: CM,
                    callback: function() {
                        return that._onDataAvailable(obj2)
                    }
                })
            } else {
                obj2.source = "filter";
                obj2.trigger = false;
                return that._onDataAvailable(obj2)
            }
        },
        filterLocalData: function(objP) {
            objP = objP || {};
            var that = this.that,
                ui, data = objP.data,
                apply = !data,
                CM = apply ? that.colModel : objP.CM,
                arrS = this.getRulesFromCM({
                    CM: CM,
                    apply: apply
                }),
                options = that.options,
                DM = options.dataModel,
                iSort = that.iSort,
                filtered, data1 = data || DM.data,
                data2 = DM.dataUF = DM.dataUF || [],
                data11 = [],
                data22 = [],
                FM = options.filterModel,
                FMmode = objP.mode || FM.mode;
            if (apply) {
                if (data2.length) {
                    filtered = true;
                    for (var i = 0, len = data2.length; i < len; i++) {
                        data1.push(data2[i])
                    }
                    data2 = DM.dataUF = []
                } else {
                    if (!arrS.length) {
                        return {
                            data: data1,
                            dataUF: data2
                        }
                    } else {
                        iSort.saveOrder()
                    }
                }
            }
            if (FM.on && FMmode && arrS && arrS.length) {
                if (data1.length) {
                    ui = {
                        filters: arrS,
                        mode: FMmode,
                        data: data1
                    };
                    if (that._trigger("customFilter", null, ui) === false) {
                        data11 = ui.dataTmp;
                        data22 = ui.dataUF
                    } else {
                        for (var i = 0, len = data1.length; i < len; i++) {
                            var rowData = data1[i];
                            if (!this.isMatchRow(rowData, arrS, FMmode)) {
                                data22.push(rowData)
                            } else {
                                data11.push(rowData)
                            }
                        }
                    }
                }
                data1 = data11;
                data2 = data22;
                if (iSort.readSorter().length === 0) {
                    data1 = iSort.sortLocalData(data1)
                }
                if (apply) {
                    DM.data = data1;
                    DM.dataUF = data2
                }
            } else if (filtered && apply) {
                ui = {
                    data: data1
                };
                if (that._trigger("clearFilter", null, ui) === false) {
                    data1 = ui.data
                }
                if (iSort.readSorter().length === 0) {
                    data1 = iSort.sortLocalData(data1)
                }
                DM.data = data1;
                that._queueATriggers.filter = {
                    ui: {
                        type: "local"
                    }
                }
            }
            if (apply) {
                that._queueATriggers.filter = {
                    ui: {
                        type: "local",
                        rules: arrS
                    }
                }
            }
            return {
                data: data1,
                dataUF: data2
            }
        },
        _getRulesFromCM: function(location, filter, condition, value, value2, dataType, getValue) {
            if (condition === "between") {
                if (value === "" || value === null) {
                    condition = "lte";
                    value = getValue(value2, dataType, condition)
                } else if (value2 === "" || value2 === null) {
                    condition = "gte";
                    value = getValue(value, dataType, condition)
                } else {
                    value = getValue(value, dataType, condition);
                    value2 = getValue(value2, dataType, condition)
                }
            } else if (condition === "regexp") {
                if (location === "remote") {
                    value = value.toString()
                } else if (typeof value === "string") {
                    try {
                        var modifiers = filter.modifiers || "gi";
                        value = new RegExp(value, modifiers)
                    } catch (ex) {
                        value = /.*/
                    }
                }
            } else if (condition === "range" || $.isArray(value)) {
                if (value === null) {
                    return
                } else {
                    if (typeof value.push === "function") {
                        if (value.length === 0) {
                            return
                        }
                        value = value.slice();
                        for (var j = 0, len = value.length; j < len; j++) {
                            value[j] = getValue(value[j], dataType, condition)
                        }
                    }
                }
            } else if (condition) {
                value = getValue(value, dataType, condition);
                if (value2 !== null) value2 = getValue(value2, dataType, condition)
            }
            var cbFn;
            if (location === "remote") {
                cbFn = ""
            } else {
                cbFn = ((filter.conditions || {})[condition] || {}).compare || pq.filter.conditions[condition].compare || cFilterData.conditions[condition]
            }
            return [value, value2, cbFn, condition]
        },
        getRulesFromCM: function(objP) {
            var CM = objP.CM;
            if (!CM) {
                throw "CM N/A"
            }
            var self = this,
                CMLength = CM.length,
                i = 0,
                location = objP.location,
                isRemote = location === "remote",
                rules = [],
                cFilterData = _pq.cFilterData,
                getValue = function(cd, dataType, condition) {
                    if (isRemote) {
                        cd = cd === null ? "" : cd;
                        return cd.toString()
                    } else {
                        return cFilterData.convertEx(cd, dataType, condition)
                    }
                };
            for (; i < CMLength; i++) {
                var column = CM[i],
                    filter = column.filter;
                if (filter) {
                    var dataIndx = column.dataIndx,
                        dataType = column.dataType,
                        rulesC = filter.crules || [filter],
                        newRulesC = [],
                        ruleobj, value, value2, condition, cbFn, arr;
                    dataType = !dataType || dataType === "stringi" || typeof dataType === "function" ? "string" : dataType;
                    rulesC.forEach(function(rule) {
                        condition = rule.condition;
                        value = rule.value;
                        value2 = rule.value2;
                        if (condition && self.isCorrect(condition, value, value2) && (arr = self._getRulesFromCM(location, filter, condition, value, value2, dataType, getValue))) {
                            value = arr[0];
                            value2 = arr[1];
                            cbFn = arr[2];
                            newRulesC.push({
                                condition: arr[3],
                                value: value,
                                value2: value2,
                                cbFn: cbFn
                            })
                        }
                    });
                    if (newRulesC.length) {
                        ruleobj = {
                            dataIndx: dataIndx,
                            dataType: dataType
                        };
                        if (isRemote && newRulesC.length === 1) {
                            ruleobj.value = newRulesC[0].value;
                            ruleobj.value2 = newRulesC[0].value2;
                            ruleobj.condition = newRulesC[0].condition
                        } else {
                            ruleobj.crules = newRulesC;
                            ruleobj.mode = filter.mode;
                            if (!isRemote) ruleobj.column = column
                        }
                        rules.push(ruleobj)
                    }
                }
            }
            if (objP.apply || isRemote) {
                this.sortRulesAndFMIndx(rules)
            }
            return rules
        },
        getCMFromRules: function(rules) {
            var that = this.that;
            return rules.map(function(rule) {
                var col = that.getColumn({
                    dataIndx: rule.dataIndx
                });
                return JSON.parse(JSON.stringify(col, function(key, val) {
                    if (key !== "parent") {
                        return val
                    }
                }))
            })
        },
        getQueryStringFilter: function() {
            var that = this.that,
                o = that.options,
                stringify = o.stringify,
                FM = o.filterModel,
                FMmode = FM.mode,
                CM = that.colModel,
                newDI = FM.newDI || [],
                rules = this.getRulesFromCM({
                    CM: CM,
                    location: "remote"
                }),
                obj, filter = "";
            if (FM && FM.on && rules) {
                if (rules.length) {
                    obj = {
                        mode: FMmode,
                        data: rules
                    };
                    filter = stringify === false ? obj : JSON.stringify(obj)
                } else {
                    filter = "";
                    if (newDI.length) {
                        that._trigger("clearFilter")
                    }
                }
            }
            return filter
        },
        isCorrect: function(condition, value, value2) {
            var conditions = pq.filter.conditions,
                obj = conditions[condition];
            if (obj) {
                if ((value === null || value === "") && (value2 === null || value2 === "")) {
                    if (!obj.nr) {
                        return false
                    }
                }
                return true
            } else {
                throw "filter condition NA"
            }
        },
        isMatchCell: function(s, rowData) {
            var dataIndx = s.dataIndx,
                column = s.column,
                dataType = s.dataType,
                value, value2, condition, cbFn, mode = s.mode,
                found = [],
                find, rules = s.crules,
                rule, len = rules.length,
                cd = rowData[dataIndx],
                cd2;
            for (var i = 0; i < len; i++) {
                rule = rules[i];
                condition = rule.condition;
                value = rule.value;
                value2 = rule.value2;
                cbFn = rule.cbFn;
                if (condition) {
                    if (condition === "regexp") {
                        cd2 = cd === null ? "" : cd
                    } else {
                        cd2 = cFilterData.convertEx(cd, dataType, condition, column)
                    }
                    found.push(cbFn(cd2, value, value2) ? true : false)
                }
            }
            len = found.length;
            if (mode === "AND") {
                for (i = 0; i < len; i++) {
                    find = found[i];
                    if (!find) {
                        return false
                    }
                }
                return true
            } else {
                for (i = 0; i < len; i++) {
                    find = found[i];
                    if (find) {
                        return true
                    }
                }
                return false
            }
        },
        isMatchRow: function(rowData, rules, FMmode) {
            var i = 0,
                len = rules.length,
                rule, found, isAND = FMmode === "AND",
                isOR = !isAND;
            if (len === 0) {
                return true
            }
            for (; i < len; i++) {
                rule = rules[i];
                found = this.isMatchCell(rule, rowData);
                if (found) rule.found = true;
                if (isOR && found) {
                    return true
                }
                if (isAND && !found) {
                    return false
                }
            }
            return isAND
        },
        onFilterChange: function() {
            var that = this.that,
                o = that.options,
                columns = that.columns,
                FM = o.filterModel,
                isRemote = FM.type === "remote",
                oldDI = FM.oldDI || [],
                noRows = !o.dataModel.data.length,
                cls = "pq-col-filtered",
                takeAllRules = isRemote || noRows,
                dis = (FM.rules || []).reduce(function(arr, rule) {
                    if (rule.found || takeAllRules) {
                        arr.push(rule.dataIndx)
                    }
                    return arr
                }, []);
            oldDI.forEach(function(di) {
                var $cell = that.getCellHeader({
                        dataIndx: di
                    }),
                    col = columns[di];
                if ($cell.length) {
                    $cell.removeClass(cls);
                    that.getCellFilter({
                        dataIndx: di
                    }).removeClass(cls)
                }
                col.clsHead = (col.clsHead || "").split(" ").filter(function(_cls) {
                    return _cls !== cls
                }).join(" ")
            });
            dis.forEach(function(di) {
                var $cell = that.getCellHeader({
                        dataIndx: di
                    }),
                    col = columns[di];
                if ($cell.length) {
                    $cell.addClass(cls);
                    that.getCellFilter({
                        dataIndx: di
                    }).addClass(cls)
                }
                col.clsHead = (col.clsHead || "") + " " + cls
            });
            FM.oldDI = FM.newDI = dis
        },
        onLoad: function() {
            var dataUF = this.that.options.dataModel.dataUF;
            if (dataUF) {
                dataUF.length = 0
            }
        },
        sortRulesAndFMIndx: function(rules) {
            var FM = this.that.options.filterModel,
                newDI = FM.newDI;
            rules.sort(function(a, b) {
                var di1 = a.dataIndx,
                    di2 = b.dataIndx,
                    i1 = newDI.indexOf(di1),
                    i2 = newDI.indexOf(di2);
                if (i1 >= 0 && i2 >= 0) {
                    return i1 - i2
                } else if (i1 >= 0) {
                    return -1
                } else if (i2 >= 0) {
                    return 1
                } else {
                    return 0
                }
            });
            FM.rules = rules
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        cSort = _pq.cSort = function(that) {
            var self = this;
            self.that = that;
            self.sorters = [];
            self.tmpPrefix = "pq_tmp_";
            self.cancel = false
        };
    _pq.pqGrid.prototype.sort = function(ui) {
        ui = ui || {};
        if (ui.data) {
            return this.iSort._sortLocalData(ui.sorter, ui.data)
        }
        var that = this,
            options = this.options,
            DM = options.dataModel,
            data = DM.data,
            SM = options.sortModel,
            type = SM.type;
        if ((!data || !data.length) && type === "local") {
            return
        }
        var EM = options.editModel,
            iSort = this.iSort,
            oldSorter = iSort.getSorter(),
            newSorter, evt = ui.evt,
            single = ui.single === null ? iSort.readSingle() : ui.single,
            cancel = iSort.readCancel();
        if (ui.sorter) {
            if (ui.addon) {
                ui.single = single;
                ui.cancel = cancel;
                newSorter = iSort.addon(ui)
            } else {
                newSorter = ui.sorter
            }
        } else {
            newSorter = iSort.readSorter()
        }
        if (!newSorter.length && !oldSorter.length) {
            return
        }
        if (EM.indices) {
            that.blurEditor({
                force: true
            })
        }
        var ui2 = {
            dataIndx: newSorter.length ? newSorter[0].dataIndx : null,
            oldSorter: oldSorter,
            sorter: newSorter,
            source: ui.source,
            single: single
        };
        if (that._trigger("beforeSort", evt, ui2) === false) {
            iSort.cancelSort();
            return
        }
        iSort.resumeSort();
        if (type === "local") {
            iSort.saveOrder()
        }
        iSort.setSorter(newSorter);
        iSort.setSingle(single);
        iSort.writeSorter(newSorter);
        iSort.writeSingle(single);
        if (type === "local") {
            DM.data = iSort.sortLocalData(data, !ui.skipCustomSort);
            this._queueATriggers["sort"] = {
                evt: evt,
                ui: ui2
            };
            if (ui.refresh !== false) {
                this.refreshView()
            }
        } else if (type === "remote") {
            this._queueATriggers["sort"] = {
                evt: evt,
                ui: ui2
            };
            if (!ui.initByRemote) {
                this.remoteRequest({
                    initBySort: true,
                    callback: function() {
                        that._onDataAvailable()
                    }
                })
            }
        }
    };
    cSort.prototype = {
        addon: function(ui) {
            ui = ui || {};
            var sorter = ui.sorter[0],
                uiDataIndx = sorter.dataIndx,
                uiDir = sorter.dir,
                single = ui.single,
                cancel = ui.cancel,
                oldSorters = this.readSorter(),
                oldSorter = oldSorters[0];
            if (single === null) {
                throw "sort single N/A"
            }
            if (uiDataIndx !== null) {
                if (single && !ui.tempMultiple) {
                    oldSorters = oldSorters.length ? [oldSorters[0]] : [];
                    oldSorter = oldSorters[0];
                    if (oldSorter && oldSorter.dataIndx === sorter.dataIndx) {
                        var oldDir = oldSorter.dir;
                        var sortDir = oldDir === "up" ? "down" : cancel && oldDir === "down" ? "" : "up";
                        if (sortDir === "") {
                            oldSorters.length--
                        } else {
                            oldSorter.dir = sortDir
                        }
                    } else {
                        sortDir = uiDir || "up";
                        oldSorters[0] = $.extend({}, sorter, {
                            dir: sortDir
                        })
                    }
                } else {
                    var indx = this.inSorters(oldSorters, uiDataIndx);
                    if (indx > -1) {
                        oldDir = oldSorters[indx].dir;
                        if (oldDir === "up") {
                            oldSorters[indx].dir = "down"
                        } else if (cancel && oldDir === "down") {
                            oldSorters.splice(indx, 1)
                        } else if (oldSorters.length === 1) {
                            oldSorters[indx].dir = "up"
                        } else {
                            oldSorters.splice(indx, 1)
                        }
                    } else {
                        oldSorters.push($.extend({}, sorter, {
                            dir: "up"
                        }))
                    }
                }
            }
            return oldSorters
        },
        cancelSort: function() {
            this.cancel = true
        },
        resumeSort: function() {
            this.cancel = false
        },
        readSorter: function() {
            var that = this.that,
                columns = that.columns,
                sorters = (that.options.sortModel.sorter || []).filter(function(sorter) {
                    return !!columns[sorter.dataIndx]
                });
            sorters = pq.arrayUnique(sorters, "dataIndx");
            return sorters
        },
        setSingle: function(m) {
            this.single = m
        },
        getSingle: function() {
            return this.single
        },
        readSingle: function() {
            return this.that.options.sortModel.single
        },
        setCancel: function(m) {
            this.cancel = m
        },
        readCancel: function() {
            return this.that.options.sortModel.cancel
        },
        saveOrder: function(data) {
            var that = this.that,
                DM = that.options.dataModel,
                rd, data;
            if (!(DM.dataUF || []).length) {
                if (!this.getSorter().length) {
                    data = that.get_p_data();
                    for (var i = 0, len = data.length; i < len; i++) {
                        rd = data[i];
                        rd && (rd.pq_order = i)
                    }
                }
            }
        },
        getCancel: function() {
            return this.cancel
        },
        getQueryStringSort: function() {
            if (this.cancel) {
                return ""
            }
            var that = this.that,
                sorters = this.sorters,
                options = that.options,
                stringify = options.stringify;
            if (sorters.length) {
                if (stringify === false) {
                    return sorters
                } else {
                    return JSON.stringify(sorters)
                }
            } else {
                return ""
            }
        },
        getSorter: function() {
            return this.sorters
        },
        setSorter: function(sorters) {
            this.sorters = sorters.slice(0)
        },
        inSorters: function(sorters, dataIndx) {
            for (var i = 0; i < sorters.length; i++) {
                if (sorters[i].dataIndx === dataIndx) {
                    return i
                }
            }
            return -1
        },
        sortLocalData: function(data, customSort) {
            var sorters = this.sorters;
            if (!sorters.length) {
                if (data.length && data[0].pq_order !== null) {
                    sorters = [{
                        dataIndx: "pq_order",
                        dir: "up",
                        dataType: "integer"
                    }]
                }
            }
            return this._sortLocalData(sorters, data, customSort)
        },
        compileSorter: function(sorters, data) {
            var self = this,
                that = self.that,
                columns = that.columns,
                o = that.options,
                arrFn = [],
                arrDI = [],
                arrDir = [],
                tmpPrefix = self.tmpPrefix,
                SM = o.sortModel,
                o_useCache = SM.useCache,
                ignoreCase = SM.ignoreCase,
                sortersLength = sorters.length;
            data = data || o.dataModel.data;
            for (var i = 0; i < sortersLength; i++) {
                var sorter = sorters[i],
                    dataIndx = sorter.sortIndx || sorter.dataIndx,
                    column = columns[dataIndx] || {},
                    _dir = sorter.dir = sorter.dir || "up",
                    dir = _dir === "up" ? 1 : -1,
                    sortType = column.sortType,
                    sortType = pq.getFn(sortType),
                    dataType = column.dataType || sorter.dataType || "string",
                    dataType = dataType === "string" && ignoreCase ? "stringi" : dataType,
                    useCache = o_useCache && dataType === "date",
                    _dataIndx = useCache ? tmpPrefix + dataIndx : dataIndx;
                arrDI[i] = _dataIndx;
                arrDir[i] = dir;
                if (sortType) {
                    arrFn[i] = function(sortType, sort_custom) {
                        return function(obj1, obj2, dataIndx, dir) {
                            return sort_custom(obj1, obj2, dataIndx, dir, sortType)
                        }
                    }(sortType, sortObj.sort_sortType)
                } else if (dataType === "integer") {
                    arrFn[i] = sortObj.sort_number
                } else if (dataType === "float") {
                    arrFn[i] = sortObj.sort_number
                } else if (typeof dataType === "function") {
                    arrFn[i] = function(dataType, sort_custom) {
                        return function(obj1, obj2, dataIndx, dir) {
                            return sort_custom(obj1, obj2, dataIndx, dir, dataType)
                        }
                    }(dataType, sortObj.sort_dataType)
                } else if (dataType === "date") {
                    arrFn[i] = sortObj["sort_date" + (useCache ? "_fast" : "")]
                } else if (dataType === "bool") {
                    arrFn[i] = sortObj.sort_bool
                } else if (dataType === "stringi") {
                    arrFn[i] = sortObj.sort_locale
                } else {
                    arrFn[i] = sortObj.sort_string
                }
                if (useCache) {
                    self.addCache(data, dataType, dataIndx, _dataIndx)
                }
            }
            return self._composite(arrFn, arrDI, arrDir, sortersLength)
        },
        _composite: function(arrFn, arrDI, arrDir, len) {
            return function sort_composite(obj1, obj2) {
                var ret = 0,
                    i = 0;
                for (; i < len; i++) {
                    ret = arrFn[i](obj1, obj2, arrDI[i], arrDir[i]);
                    if (ret !== 0) {
                        break
                    }
                }
                return ret
            }
        },
        _sortLocalData: function(sorters, data, useCustomSort) {
            if (!data) {
                return []
            }
            if (!data.length || !sorters || !sorters.length) {
                return data
            }
            var self = this,
                that = self.that,
                SM = that.options.sortModel,
                sort_composite = self.compileSorter(sorters, data),
                ui = {
                    sort_composite: sort_composite,
                    data: data,
                    sorter: sorters
                };
            if (useCustomSort && that._trigger("customSort", null, ui) === false) {
                data = ui.data
            } else {
                data.sort(sort_composite)
            }
            if (SM.useCache) {
                self.removeCache(sorters, data)()
            }
            return data
        },
        addCache: function(data, dataType, dataIndx, _dataIndx) {
            var valueFn = sortObj["get_" + dataType],
                j = data.length;
            while (j--) {
                var rowData = data[j];
                rowData[_dataIndx] = valueFn(rowData[dataIndx])
            }
        },
        removeCache: function(sorters, data) {
            var tmpPrefix = this.tmpPrefix;
            return function() {
                var i = sorters.length;
                while (i--) {
                    var sorter = sorters[i],
                        _dataIndx = tmpPrefix + sorter.dataIndx,
                        j = data.length;
                    if (j && data[0].hasOwnProperty(_dataIndx)) {
                        while (j--) {
                            delete data[j][_dataIndx]
                        }
                    }
                }
            }
        },
        writeCancel: function(m) {
            this.that.options.sortModel.cancel = m
        },
        writeSingle: function(m) {
            this.that.options.sortModel.single = m
        },
        writeSorter: function(sorter) {
            var o = this.that.options,
                SM = o.sortModel;
            SM.sorter = sorter
        }
    };
    var sortObj = {
        get_date: function(val) {
            var val2;
            return val ? isNaN(val2 = Date.parse(val)) ? 0 : val2 : 0
        },
        sort_number: function(obj1, obj2, dataIndx, dir) {
            var val1 = obj1[dataIndx],
                val2 = obj2[dataIndx];
            val1 = val1 ? val1 * 1 : 0;
            val2 = val2 ? val2 * 1 : 0;
            return (val1 - val2) * dir
        },
        sort_date: function(obj1, obj2, dataIndx, dir) {
            var val1 = obj1[dataIndx],
                val2 = obj2[dataIndx];
            val1 = val1 ? Date.parse(val1) : 0;
            val2 = val2 ? Date.parse(val2) : 0;
            return (val1 - val2) * dir
        },
        sort_date_fast: function(obj1, obj2, dataIndx, dir) {
            var val1 = obj1[dataIndx],
                val2 = obj2[dataIndx];
            return (val1 - val2) * dir
        },
        sort_dataType: function(obj1, obj2, dataIndx, dir, dataType) {
            var val1 = obj1[dataIndx],
                val2 = obj2[dataIndx];
            return dataType(val1, val2) * dir
        },
        sort_sortType: function(obj1, obj2, dataIndx, dir, sortType) {
            return sortType(obj1, obj2, dataIndx) * dir
        },
        sort_string: function(obj1, obj2, dataIndx, dir) {
            var val1 = obj1[dataIndx] || "",
                val2 = obj2[dataIndx] || "",
                ret = 0;
            if (val1 > val2) {
                ret = 1
            } else if (val1 < val2) {
                ret = -1
            }
            return ret * dir
        },
        sort_locale: function(obj1, obj2, dataIndx, dir) {
            var val1 = obj1[dataIndx] || "",
                val2 = obj2[dataIndx] || "";
            return val1.localeCompare(val2) * dir
        },
        sort_bool: function(obj1, obj2, dataIndx, dir) {
            var val1 = obj1[dataIndx],
                val2 = obj2[dataIndx],
                ret = 0;
            if (val1 && !val2 || val1 === false && val2 === null) {
                ret = 1
            } else if (val2 && !val1 || val2 === false && val1 === null) {
                ret = -1
            }
            return ret * dir
        }
    };
    pq.sortObj = sortObj
})(jQuery);
(function($) {
    function calcVisibleRows(pdata, rip1, rip2) {
        var num = 0,
            rd, i = rip1,
            len = pdata.length;
        rip2 = rip2 > len ? len : rip2;
        for (; i < rip2; i++) {
            rd = pdata[i];
            if (rd.pq_hidden !== true) {
                num++
            }
        }
        return num
    }
    var fn = $.paramquery.pqGrid.prototype;
    fn.calcVisibleRows = calcVisibleRows;

    function cMerge(that) {
        this.that = that;
        this.mc = null;
        var self = this;
        that.on("dataReady columnOrder groupShowHide", function(evt, ui) {
            if (that.options.mergeCells && ui.source !== "pager") {
                self.init()
            }
        })
    }
    $.paramquery.cMerge = cMerge;
    cMerge.prototype = {
        calcVisibleColumns: function(CM, ci1, ci2) {
            var num = 0,
                len = CM.length;
            ci2 = ci2 > len ? len : ci2;
            for (; ci1 < ci2; ci1++) {
                if (CM[ci1].hidden !== true) {
                    num++
                }
            }
            return num
        },
        findNextVisibleColumn: function(CM, ci, cs) {
            var i = ci,
                column;
            for (; i < ci + cs; i++) {
                column = CM[i];
                if (!column) {
                    return -1
                }
                if (!column.hidden) {
                    return i
                }
            }
        },
        findNextVisibleRow: function(pdata, rip, rs) {
            var i = rip,
                rowdata;
            for (; i < rip + rs; i++) {
                rowdata = pdata[i];
                if (!rowdata) {
                    return -1
                }
                if (!rowdata.pq_hidden) {
                    return i
                }
            }
        },
        getData: function(ri, ci, key) {
            var mcRec, mc = this.mc;
            if (mc[ri] && (mcRec = mc[ri][ci])) {
                var data = mcRec.data;
                return data ? data[key] : null
            }
        },
        inflateRange: function(r1, c1, r2, c2) {
            var that = this.that,
                expand = false,
                o = that.options,
                GM = o.groupModel,
                max_ri2 = GM.on ? that.riOffset + that.pdata.length - 1 : o.dataModel.data.length - 1,
                max_ci2 = that.colModel.length - 1,
                mc = this.mc2;
            if (!mc) {
                return [r1, c1, r2, c2]
            }
            expando: for (var i = 0, len = mc.length; i < len; i++) {
                var rec = mc[i],
                    ri1 = rec.r1,
                    ci1 = rec.c1,
                    ri2 = ri1 + rec.rc - 1,
                    ci2 = ci1 + rec.cc - 1,
                    ri2 = ri2 > max_ri2 ? max_ri2 : ri2,
                    ci2 = ci2 > max_ci2 ? max_ci2 : ci2,
                    topEdge = ri1 < r1 && ri2 >= r1,
                    botEdge = ri1 <= r2 && ri2 > r2,
                    leftEdge = ci1 < c1 && ci2 >= c1,
                    rightEdge = ci1 <= c2 && ci2 > c2;
                if ((topEdge || botEdge) && ci2 >= c1 && ci1 <= c2 || (leftEdge || rightEdge) && ri2 >= r1 && ri1 <= r2) {
                    expand = true;
                    r1 = ri1 < r1 ? ri1 : r1;
                    c1 = ci1 < c1 ? ci1 : c1;
                    r2 = ri2 > r2 ? ri2 : r2;
                    c2 = ci2 > c2 ? ci2 : c2;
                    break expando
                }
            }
            if (expand) {
                return this.inflateRange(r1, c1, r2, c2)
            } else {
                return [r1, c1, r2, c2]
            }
        },
        init: function() {
            var that = this.that,
                findNextVisibleColumn = this.findNextVisibleColumn,
                findNextVisibleRow = this.findNextVisibleRow,
                calcVisibleColumns = this.calcVisibleColumns,
                CM = that.colModel,
                mc_o = that.options.mergeCells || [],
                data = that.get_p_data(),
                arr2 = [],
                arr = [];
            for (var i = 0, len = mc_o.length; i < len; i++) {
                var rec = mc_o[i],
                    r1 = rec.r1,
                    v_r1 = r1,
                    rowdata = data[r1],
                    c1 = rec.c1,
                    v_c1 = c1,
                    column = CM[c1],
                    rs = rec.rc,
                    cs = rec.cc,
                    cs2, rs2;
                if (!column || !rowdata) {
                    continue
                }
                if (column.hidden) {
                    v_c1 = findNextVisibleColumn(CM, c1, cs)
                }
                cs2 = calcVisibleColumns(CM, c1, c1 + cs);
                if (rowdata.pq_hidden) {
                    v_r1 = findNextVisibleRow(data, r1, rs)
                }
                rs2 = calcVisibleRows(data, r1, r1 + rs);
                if (rs2 < 1 || cs2 < 1) {
                    continue
                }
                arr2.push({
                    r1: r1,
                    c1: c1,
                    rc: rs,
                    cc: cs
                });
                arr[v_r1] = arr[v_r1] || [];
                arr[v_r1][v_c1] = {
                    show: true,
                    rowspan: rs2,
                    colspan: cs2,
                    o_rowspan: rs,
                    o_colspan: cs,
                    style: rec.style,
                    cls: rec.cls,
                    attr: rec.attr,
                    r1: r1,
                    c1: c1,
                    v_r1: v_r1,
                    v_c1: v_c1
                };
                var hidden_obj = {
                    show: false,
                    r1: r1,
                    c1: c1,
                    v_r1: v_r1,
                    v_c1: v_c1
                };
                for (var j = r1; j < r1 + rs; j++) {
                    arr[j] = arr[j] || [];
                    for (var k = c1; k < c1 + cs; k++) {
                        if (j === v_r1 && k === v_c1) {
                            continue
                        }
                        arr[j][k] = hidden_obj
                    }
                }
            }
            that._mergeCells = arr.length > 0;
            this.mc = arr;
            this.mc2 = arr2
        },
        ismergedCell: function(ri, ci) {
            var mc = this.mc,
                mcRec;
            if (mc && mc[ri] && (mcRec = mc[ri][ci])) {
                var v_ri = mcRec.v_r1,
                    v_ci = mcRec.v_c1;
                if (ri === v_ri && ci === v_ci) {
                    return {
                        o_ri: mcRec.r1,
                        o_ci: mcRec.c1,
                        v_rc: mcRec.rowspan,
                        v_cc: mcRec.colspan,
                        o_rc: mcRec.o_rowspan,
                        o_cc: mcRec.o_colspan
                    }
                } else {
                    return true
                }
            } else {
                return false
            }
        },
        isRootCell: function(r1, c1, type) {
            var mc = this.mc,
                mcRec;
            if (mc && mc[r1] && (mcRec = mc[r1][c1])) {
                if (type === "o") {
                    return r1 === mcRec.r1 && c1 === mcRec.c1
                }
                var v_r1 = mcRec.v_r1,
                    v_c1 = mcRec.v_c1;
                if (v_r1 === r1 && v_c1 === c1) {
                    var mcRoot = mc[v_r1][v_c1];
                    return {
                        rowspan: mcRoot.rowspan,
                        colspan: mcRoot.colspan
                    }
                }
            }
        },
        removeData: function(ri, ci, key) {
            var that = this.that,
                mcRec, mc = this.mc;
            if (mc && mc[ri] && (mcRec = mc[ri][ci])) {
                var data = mcRec.data;
                if (data) {
                    data[key] = null
                }
            }
        },
        getRootCell: function(r1, ci) {
            var mc = this.mc,
                v_ri, v_ci, mcRec;
            if (mc && mc[r1] && (mcRec = mc[r1][ci])) {
                v_ri = mcRec.v_r1;
                v_ci = mcRec.v_c1;
                mcRec = mc[v_ri][v_ci];
                return {
                    o_ri: mcRec.r1,
                    o_ci: mcRec.c1,
                    v_ri: v_ri,
                    v_ci: v_ci,
                    v_rc: mcRec.rowspan,
                    v_cc: mcRec.colspan,
                    o_rc: mcRec.o_rowspan,
                    o_cc: mcRec.o_colspan
                }
            }
        },
        getRootCellO: function(ri, ci, always, type) {
            type = type || "o";
            var o = type === "o",
                obj = this.getRootCell(ri, ci),
                ui;
            if (obj) {
                ui = {
                    rowIndx: obj[o ? "o_ri" : "v_ri"],
                    colIndx: obj[o ? "o_ci" : "v_ci"]
                };
                return this.that.normalize(ui)
            } else if (always) {
                ui = {
                    rowIndx: ri,
                    colIndx: ci
                }
            }
            return ui ? this.that.normalize(ui) : null
        },
        getRootCellV: function(ri, ci, always) {
            return this.getRootCellO(ri, ci, always, "v")
        },
        getClsStyle: function(v_ri, v_ci) {
            return this.mc[v_ri][v_ci]
        },
        getMergeCells: function(hcLen, curPage, dataLen) {
            var that = this.that,
                mcarr = that.options.mergeCells,
                mc, r1, c1, offset = that.riOffset,
                offset2 = offset + dataLen,
                arr = [],
                mcLen = mcarr ? mcarr.length : 0;
            for (var i = 0; i < mcLen; i++) {
                mc = mcarr[i];
                r1 = mc.r1;
                c1 = mc.c1;
                if (!curPage || r1 >= offset && r1 < offset2) {
                    if (curPage) {
                        r1 -= offset
                    }
                    r1 += hcLen;
                    arr.push({
                        r1: r1,
                        c1: c1,
                        r2: r1 + mc.rc - 1,
                        c2: c1 + mc.cc - 1
                    })
                }
            }
            return arr
        },
        setData: function(ri, ci, data) {
            var mcRec, mc = this.mc;
            if (mc[ri] && (mcRec = mc[ri][ci])) {
                mcRec.data = data
            }
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    _pq.pqGrid.defaults.groupModel = {
        agg: {},
        cascade: true,
        cbId: "pq_group_cb",
        collapsed: [],
        dataIndx: [],
        fixCols: true,
        groupCols: [],
        header: true,
        headerMenu: true,
        icon: ["ui-icon-triangle-1-se", "ui-icon-triangle-1-e"],
        id: "pq_gid",
        parentId: "parentId",
        childstr: "children",
        menuItems: ["merge", "fixCols", "grandSummary"],
        on: false,
        refreshOnChange: true,
        pivotColsTotal: "after",
        separator: "_",
        source: "checkboxGroup",
        showSummary: [],
        summaryInTitleRow: "collapsed",
        summaryEdit: true,
        title: [],
        titleDefault: "{0} ({1})"
    };
    pq.aggregate = {
        sum: function(arr) {
            var s = 0,
                i = arr.length,
                val;
            while (i--) {
                val = arr[i];
                if (val !== null) {
                    s += val - 0
                }
            }
            return s
        },
        avg: function(arr, column) {
            try {
                var avg = pq.formulas.AVERAGE(arr)
            } catch (ex) {
                avg = ex
            }
            return isNaN(avg) ? null : avg
        },
        flatten: function(arr) {
            return arr.filter(function(val) {
                return val !== null
            })
        },
        max: function(arr, column) {
            var ret, dataType = column.dataType;
            arr = this.flatten(arr);
            if (arr.length) {
                if (dataType === "float" || dataType === "integer") {
                    ret = Math.max.apply(Math, arr)
                } else if (dataType === "date") {
                    arr.sort(function(a, b) {
                        a = Date.parse(a);
                        b = Date.parse(b);
                        return b - a
                    });
                    ret = arr[0]
                } else {
                    arr.sort();
                    ret = arr[arr.length - 1]
                }
                return ret
            }
        },
        min: function(arr, column) {
            var ret, dataType = column.dataType,
                dateArr, dateO, i;
            arr = this.flatten(arr);
            if (arr.length) {
                if (dataType === "integer" || dataType === "float") {
                    ret = Math.min.apply(Math, arr)
                } else if (dataType === "date") {
                    i = arr.length;
                    dateArr = [];
                    while (i--) {
                        dateO = arr[i];
                        dateArr.push({
                            dateO: dateO,
                            dateP: Date.parse(dateO)
                        })
                    }
                    dateArr.sort(function(a, b) {
                        return a.dateP - b.dateP
                    });
                    ret = dateArr.length ? dateArr[0].dateO : undefined
                } else {
                    arr.sort();
                    ret = arr[0]
                }
                return ret
            }
        },
        count: function(arr) {
            return this.flatten(arr).length
        },
        stdev: function(arr) {
            try {
                var v = pq.formulas.STDEV(arr)
            } catch (ex) {
                v = ex
            }
            return isNaN(v) ? null : v
        },
        stdevp: function(arr) {
            try {
                var v = pq.formulas.STDEVP(arr)
            } catch (ex) {
                v = ex
            }
            return isNaN(v) ? null : v
        }
    };
    var cGroup = _pq.cGroup = function(that) {
        var self = this,
            GM = that.options.groupModel;
        self.model = "groupModel";
        self.cbId = GM.cbId;
        self.childstr = GM.childstr;
        self.id = GM.id;
        self.parentId = GM.parentId;
        self.cache = [];
        self.prop = "pq_group_prop";
        self.that = that;
        if (GM.on) {
            self.init()
        }
    };
    cGroup.beforeTrigger = function(evt, that) {
        return function(state) {
            return that._trigger("beforeGroupExpand", evt, state) === false
        }
    };
    cGroup.onGroupItemClick = function(self) {
        return function(evt) {
            var $target = $(evt.target),
                dataIndx = $(this).data("indx");
            if ($target.hasClass("pq-group-remove")) {
                self.removeGroup(dataIndx)
            } else {
                self.toggleLevel(dataIndx, evt)
            }
        }
    };

    function tmpl(arr, GM, option, o) {
        arr.push("<li data-option='", option, "' class='pq-menu-item'>", "<label>", "<input type='checkbox' ", GM[option] ? "checked" : "", "/>", o["strGroup_" + option], "</label></li>")
    }
    cGroup.prototype = $.extend({}, pq.mixin.ChkGrpTree, pq.mixin.GrpTree, {
        addGroup: function(dataIndx, indx) {
            var self = this,
                that = self.that,
                GMDI = that.options.groupModel.dataIndx || [],
                obj = pq.objectify(GMDI),
                arr = GMDI.slice();
            if (dataIndx !== null && !obj[dataIndx]) {
                if (indx === null) arr.push(dataIndx);
                else arr.splice(indx, 0, dataIndx);
                self.option({
                    dataIndx: arr
                }, "", "", function() {
                    self.triggerChange()
                })
            }
        },
        createHeader: function() {
            var self = this,
                that = self.that,
                $h = self.$header,
                o = that.options,
                BS = o.bootstrap,
                columns = that.columns,
                BS_on = BS.on,
                GM = o.groupModel,
                GMdataIndx = GM.dataIndx,
                len = GMdataIndx.length;
            while (len--) {
                if (columns[GMdataIndx[len]] === null) {
                    GMdataIndx.splice(len, 1)
                }
            }
            len = GMdataIndx.length;
            if (GM.header && GM.on) {
                if ($h) {
                    $h.empty()
                } else {
                    $h = self.$header = $("<div class='pq-group-header ui-helper-clearfix' ></div>").appendTo(that.$top);
                    $h.on("click", ".pq-group-item", cGroup.onGroupItemClick(self))
                }
                if (len) {
                    var arr = [];
                    for (var i = 0; i < len; i++) {
                        var dataIndx = GMdataIndx[i],
                            column = columns[dataIndx],
                            collapsed = GM.collapsed,
                            icon = BS_on ? BS.groupModel.icon : GM.icon,
                            cicon = collapsed[i] ? icon[1] : icon[0];
                        arr.push("<div tabindex='0' class='pq-group-item' data-indx='", dataIndx, "' >", "<span class='", self.toggleIcon, cicon, "' ></span>", column.pq_title || (typeof column.title === "string" ? column.title : dataIndx), "<span class='", self.groupRemoveIcon, "' ></span></div>")
                    }
                    $h[0].innerHTML = arr.join("")
                }
                self.initHeader(o, GM)
            } else if ($h) {
                $h.remove();
                self.$header = null
            }
        },
        collapse: function(level) {
            this.expand(level, true)
        },
        collapseAll: function(level) {
            this.expandAll(level, true)
        },
        collapseTo: function(address) {
            this.expandTo(address, true)
        },
        concat: function() {
            var parentIdStr = this.parentId,
                idstr = this.id,
                childstr = this.childstr;
            return function concat(ndata, children, titleRow) {
                var id = titleRow[idstr];
                children.forEach(function(rd) {
                    rd[parentIdStr] = id;
                    ndata.push(rd)
                });
                titleRow[childstr] = children;
                return ndata
            }
        },
        editorSummary: function(o, GM) {
            var self = this;
            return function(ui) {
                var rd = ui.rowData;
                if (rd.pq_gsummary || rd.pq_gtitle) {
                    var _aggr = pq.aggregate,
                        column = ui.column,
                        csummary = column.summary,
                        cs_edit = csummary ? csummary.edit : null,
                        inArray = $.inArray,
                        dt = column.dataType,
                        allow, arr = [""];
                    if (inArray(ui.dataIndx, GM.dataIndx) > -1) {
                        return false
                    }
                    if (!GM.summaryEdit && !cs_edit || cs_edit === false) {
                        return false
                    }
                    allow = self.getAggOptions(dt);
                    for (var key in _aggr) {
                        if (inArray(key, allow) > -1) {
                            arr.push(key)
                        }
                    }
                    if (arr.length === 1) {
                        return false
                    }
                    return {
                        type: "select",
                        prepend: GM.prepend,
                        options: GM.options || arr,
                        valueIndx: GM.valueIndx,
                        labelIndx: GM.labelIndx,
                        init: GM.init || self.editorInit,
                        getData: GM.getData || self.editorGetData
                    }
                }
            }
        },
        editorInit: function(ui) {
            var summary = ui.column.summary,
                type, GMDI = this.options.groupModel.dataIndx;
            if (!summary) {
                summary = ui.column.summary = {}
            }
            type = summary[GMDI[ui.rowData.pq_level]] || summary.type;
            ui.$cell.find("select").val(type)
        },
        editorGetData: function(ui) {
            var column = ui.column,
                GMDI = this.options.groupModel.dataIndx,
                diLevel = GMDI[ui.rowData.pq_level],
                dt = column.dataType,
                summary = column.summary,
                val = ui.$cell.find("select").val();
            summary[summary[diLevel] ? diLevel : "type"] = val;
            this.one("beforeValidate", function(evt, ui) {
                ui.allowInvalid = true;
                ui.track = false;
                ui.history = false;
                column.dataType = "string";
                this.one(true, "change", function(evt, ui) {
                    column.dataType = dt
                })
            });
            return val
        },
        expandTo: function(address, _close) {
            var that = this.that,
                close = !!_close,
                indices = address.split(","),
                len = indices.length,
                childstr = this.childstr,
                node, indx, nodes = this.getRoots(that.pdata),
                i = 0;
            while (i < len) {
                indx = indices[i];
                node = nodes[indx];
                if (node) {
                    if (!close) node.pq_close = close;
                    nodes = node[childstr];
                    i++
                } else {
                    break
                }
            }
            if (node) {
                node.pq_close = close;
                if (that._trigger("group", null, {
                        node: node,
                        close: close
                    }) !== false) {
                    this.softRefresh()
                }
            }
        },
        expandAll: function(level, close) {
            level = level || 0;
            close = !!close;
            if (this.trigger({
                    all: true,
                    close: close,
                    level: level
                }) !== false) {
                this.that.pdata.forEach(function(rd) {
                    if (rd.pq_level >= level) {
                        rd.pq_close = close
                    }
                });
                this.createHeader();
                this.softRefresh()
            }
        },
        expand: function(level, close) {
            level = level || 0;
            if (this.trigger({
                    close: !!close,
                    level: level
                }) !== false) {
                this.that.pdata.forEach(function(rd) {
                    if (rd.pq_level === level) {
                        rd.pq_close = close
                    }
                });
                this.createHeader();
                this.softRefresh()
            }
        },
        firstCol: function() {
            return this.that.colModel[this.that.getFirstVisibleCI()]
        },
        flattenG: function(columns, group, GM, summary) {
            var self = this,
                GMDataIndx = GM.dataIndx,
                titleInFirstCol = GM.titleInFirstCol,
                idstr = self.id,
                parentIdStr = self.parentId,
                childstr = self.childstr,
                separator = GM.separator,
                diFirstCol = titleInFirstCol ? self.firstCol().dataIndx : null,
                concat = self.concat(),
                GMLen = GMDataIndx.length,
                ndata = [];
            return function flattenG(data, _level, parent, titleNest) {
                if (!GMLen) {
                    return data
                }
                parent = parent || {};
                var level = _level || 0,
                    children = parent[childstr],
                    di = GMDataIndx[level],
                    collapsed = GM.collapsed[level],
                    showSummary = GM.showSummary[level],
                    arr = group(data, di, columns[di]);
                arr.forEach(function(_arr) {
                    var titleRow, arr2 = _arr[1],
                        summaryRow, title = _arr[0],
                        titleNest2 = (titleNest ? titleNest + separator : "") + title,
                        items = arr2.length,
                        rip = ndata.length;
                    titleRow = {
                        pq_gtitle: true,
                        pq_level: level,
                        pq_close: collapsed,
                        pq_items: items
                    };
                    titleRow[idstr] = titleNest2;
                    titleRow[parentIdStr] = parent[idstr];
                    titleRow[childstr] = [];
                    titleRow[di] = title;
                    if (titleInFirstCol) titleRow[diFirstCol] = title;
                    ndata.push(titleRow);
                    children && children.push(titleRow);
                    if (level + 1 < GMLen) {
                        flattenG(arr2, level + 1, titleRow, titleNest2)
                    } else {
                        ndata = concat(ndata, arr2, titleRow)
                    }
                });
                return ndata
            }
        },
        getAggOptions: function(dt) {
            var o = this.that.options,
                map = o.summaryOptions;
            if (dt === "integer" || dt === "float") {
                dt = "number"
            } else if (dt !== "date") {
                dt = "string"
            }
            return map[dt].split(",")
        },
        getVal: function(ignoreCase) {
            var trim = $.trim;
            return function(rd, dataIndx, column) {
                var val = rd[dataIndx],
                    chg = column.groupChange;
                if (chg) {
                    chg = pq.getFn(chg);
                    return chg(val)
                } else {
                    val = trim(val);
                    return ignoreCase ? val.toUpperCase() : val
                }
            }
        },
        getSumCols: function() {
            return this._sumCols
        },
        getSumDIs: function() {
            return this._sumDIs
        },
        group: function(getVal) {
            return function group(data, di, column) {
                var obj = {},
                    arr = [];
                data.forEach(function(rd) {
                    rd.pq_hidden = undefined;
                    var title = getVal(rd, di, column),
                        indx = obj[title];
                    if (indx === null) {
                        obj[title] = indx = arr.length;
                        arr[indx] = [title, []]
                    }
                    arr[indx][1].push(rd)
                });
                return arr
            }
        },
        groupData: function() {
            var self = this,
                that = self.that,
                o = that.options,
                GM = o.groupModel,
                getVal = self.getVal(GM.ignoreCase),
                GMdataIndx = GM.dataIndx,
                pdata = that.pdata,
                columns = that.columns,
                arr = self.setSumCols(GMdataIndx),
                summaryFn = function() {};
            that.pdata = self.flattenG(columns, self.group(getVal), GM, summaryFn)(pdata);
            self.summaryT()
        },
        hideRows: function(initIndx, level, GMmerge, GMsummaryInTitleRow) {
            var that = this.that,
                rd, hide = true,
                data = that.pdata;
            for (var i = initIndx, len = data.length; i < len; i++) {
                rd = data[i];
                if (rd.pq_gsummary) {
                    if (GMmerge || GMsummaryInTitleRow) {
                        if (rd.pq_level >= level) {
                            rd.pq_hidden = hide
                        }
                    } else {
                        if (rd.pq_level > level) {
                            rd.pq_hidden = hide
                        }
                    }
                } else if (rd.pq_gtitle) {
                    if (rd.pq_level <= level) {
                        break
                    } else {
                        rd.pq_hidden = hide
                    }
                } else {
                    rd.pq_hidden = hide
                }
            }
        },
        init: function() {
            var self = this,
                o, GM, BS, BS_on, base_icon, that;
            self.onCMInit();
            if (!self._init) {
                self.mc = [];
                self.summaryData = [];
                that = self.that;
                o = that.options;
                GM = o.groupModel;
                BS = o.bootstrap;
                BS_on = BS.on;
                base_icon = BS_on ? "glyphicon " : "ui-icon ";
                self.groupRemoveIcon = "pq-group-remove " + base_icon + (BS_on ? "glyphicon-remove" : "ui-icon-close");
                self.toggleIcon = "pq-group-toggle " + base_icon;
                that.on("cellClick", self.onCellClick(self)).on("cellKeyDown", self.onCellKeyDown(self, GM)).on(true, "cellMouseDown", self.onCellMouseDown()).on("change", self.onChange(self, GM)).on("dataReady", self.onDataReady(self, that)).on("beforeFilterDone", function() {
                    self.saveState()
                }).on("columnDragDone", self.onColumnDrag(self)).on("columnOrder", self.onColumnOrder(self, GM)).on("customSort", self.onCustomSort.bind(self)).on("valChange", self.onCheckbox(self, GM)).on("refresh refreshRow", self.onRefresh(self, GM)).on("refreshHeader", self.onRefreshHeader.bind(self));
                if (GM.titleInFirstCol) {
                    that.on("CMInit", self.onCMInit.bind(self))
                }
                that.on("beforeCheck", self.onBeforeCheck.bind(self));
                self.setCascadeInit(true);
                self._init = true
            }
        },
        initHeadSortable: function() {
            var self = this,
                that = self.that,
                $h = self.$header,
                o = that.options;
            $h.sortable({
                axis: "x",
                distance: 3,
                tolerance: "pointer",
                cancel: ".pq-group-menu",
                stop: self.onSortable(self, o)
            })
        },
        initHeadDroppable: function() {
            var self = this,
                that = self.that,
                $h = self.$header;
            if ($h) {
                $h.droppable({
                    accept: function($td) {
                        var colIndxDrag = $td.attr("pq-col-indx") * 1;
                        if (isNaN(colIndxDrag) || !that.colModel[colIndxDrag]) {
                            return
                        }
                        return self.acceptDrop
                    },
                    tolerance: "pointer",
                    hoverClass: "pq-drop-hover",
                    drop: self.onDrop(that, self)
                });
                self.acceptDrop = true
            }
        },
        initHeader: function(o, GM) {
            var self = this;
            if (self.$header) {
                var $h = self.$header,
                    $items = $h.find(".pq-group-item");
                if ($h.data("uiSortable")) {} else {
                    self.initHeadSortable()
                }
                if (!$items.length) {
                    $h.append("<span class='pq-group-placeholder'>" + o.strGroup_header + "</span>")
                }
                if (GM.headerMenu) {
                    self.initHeaderMenu()
                }
            }
        },
        initHeaderMenu: function() {
            var self = this,
                that = self.that,
                BS_on = that.BS_on,
                o = that.options,
                $h = self.$header,
                arr = ["<ul class='pq-group-menu'><li>", BS_on ? "<span class='glyphicon glyphicon-chevron-left'></span>" : "", "<ul>"],
                GM = o.groupModel,
                menuItems = GM.menuItems,
                i = 0,
                len = menuItems.length,
                $menu;
            for (; i < len; i++) {
                tmpl(arr, GM, menuItems[i], o)
            }
            arr.push("</ul></li></ul>");
            $menu = $(arr.join("")).appendTo($h);
            $menu.menu({
                icons: {
                    submenu: "ui-icon-carat-1-w"
                },
                position: {
                    my: "right top",
                    at: "left top"
                }
            });
            $menu.change(function(evt) {
                if (evt.target.nodeName === "INPUT") {
                    var $target = $(evt.target),
                        option = $target.closest("li").data("option"),
                        ui = {};
                    ui[option] = !o.groupModel[option];
                    self.option(ui)
                }
            })
        },
        isOn: function() {
            var m = this.that.options.groupModel;
            return m.on && (m.dataIndx || []).length
        },
        getRC: function(rd) {
            var items = 1,
                self = this;
            (rd[self.childstr] || []).forEach(function(child) {
                items += self.getRC(child)
            });
            return items + (rd.pq_child_sum ? 1 : 0)
        },
        initmerge: function() {
            var self = this,
                that = self.that,
                o = that.options,
                GM = o.groupModel,
                GMmerge = GM.merge,
                summaryInTitleRow = GM.summaryInTitleRow,
                titleInFirstCol = GM.titleInFirstCol,
                items, CMLength = that.colModel.length,
                mc = [],
                GMDI = GM.dataIndx,
                lastLevel = GMDI.length - 1,
                pdata = that.pdata || [];
            if (GMmerge) {
                GMDI.forEach(function(di, level) {
                    pdata.forEach(function(rd) {
                        if (rd.pq_gtitle && level === rd.pq_level) {
                            items = self.getRC(rd);
                            mc.push({
                                r1: rd.pq_ri,
                                rc: items,
                                c1: level,
                                cc: 1
                            })
                        }
                    })
                })
            } else if (GMDI.length) {
                pdata.forEach(function(rd) {
                    if (rd.pq_gtitle) {
                        if (!summaryInTitleRow || !rd.pq_close && summaryInTitleRow === "collapsed") {
                            mc.push({
                                r1: rd.pq_ri,
                                rc: 1,
                                c1: titleInFirstCol ? 0 : rd.pq_level,
                                cc: CMLength
                            })
                        }
                    }
                })
            }
            if (mc.length) {
                self.mc = o.mergeCells = mc;
                that.iMerge.init()
            } else if (this.mc.length) {
                self.mc.length = 0;
                that.iMerge.init()
            }
        },
        initcollapsed: function() {
            var that = this.that,
                GM = that.options.groupModel,
                GMmerge = GM.merge,
                GMsummaryInTitleRow = GM.summaryInTitleRow,
                cache = this.cacheClose,
                pdata = that.pdata,
                idstr = this.id,
                rowData, pq_gtitle, o_collapsed, level, collapsed;
            if (pdata) {
                for (var i = 0, len = pdata.length; i < len; i++) {
                    rowData = pdata[i];
                    pq_gtitle = rowData.pq_gtitle;
                    if (pq_gtitle) {
                        level = rowData.pq_level;
                        collapsed = null;
                        if (cache) {
                            o_collapsed = cache[rowData[idstr]];
                            if (o_collapsed !== null) {
                                delete cache[rowData[idstr]];
                                collapsed = rowData.pq_close = o_collapsed
                            }
                        }
                        if (collapsed === null) {
                            collapsed = rowData.pq_close
                        }
                        if (collapsed) {
                            this.hideRows(i + 1, level, GMmerge, GMsummaryInTitleRow)
                        } else if (GMmerge) {
                            rowData.pq_hidden = true
                        }
                    }
                }
            }
        },
        updateItems: function(arr) {
            var self = this,
                items = 0,
                children, len, childstr = self.childstr;
            (arr || self.that.pdata).forEach(function(rd) {
                if (rd.pq_gtitle) {
                    children = rd[childstr];
                    len = children.length;
                    if (len && children[0][childstr]) {
                        rd.pq_items = self.updateItems(children)
                    } else {
                        rd.pq_items = len
                    }
                    items += rd.pq_items
                }
            });
            return items
        },
        removeEmptyParent: function(parent) {
            var self = this,
                pdata = self.that.pdata,
                childstr = self.childstr;
            if (!parent[childstr].length) {
                var parentP = self.getParent(parent),
                    children = parentP ? parentP[childstr] : pdata,
                    indx = children.indexOf(parent);
                children.splice(indx, 1);
                if (parentP) self.removeEmptyParent(parentP)
            }
        },
        addNodes: function(nodes, parentNew, indx) {
            this.moveNodes(nodes, parentNew, indx, true)
        },
        deleteNodes: function(nodes) {
            this.moveNodes(nodes, null, null, null, true)
        },
        moveNodes: function(nodes, parentNew, indx, add, remove) {
            var self = this,
                that = self.that,
                childstr = self.childstr,
                parentOld, hidden = "pq_hidden",
                o = that.options,
                GM = o.groupModel,
                GMDI = GM.dataIndx,
                id = self.id,
                indxOld, data = o.dataModel.data,
                parentIdStr = self.parentId,
                i = 0,
                len = nodes.length,
                node;
            if (!GMDI.length) {}
            if (parentNew) {
                var children = parentNew[childstr],
                    childrenLen = children.length,
                    sibling = children[0],
                    indx = indx === null || indx >= childrenLen ? childrenLen : indx,
                    indxDATA = data.indexOf(sibling) + indx;
                if (sibling.pq_gtitle) {
                    throw "incorrect nodes"
                }
            }
            nodes = nodes.slice(0);
            if (len) {
                that._trigger("beforeMoveNode");
                for (; i < len; i++) {
                    node = nodes[i];
                    if (add) {
                        parentNew[childstr].splice(indx++, 0, node)
                    } else {
                        parentOld = self.getParent(node);
                        indxOld = parentOld[childstr].indexOf(node);
                        if (remove) {
                            parentOld[childstr].splice(indxOld, 1)
                        } else {
                            if (parentOld === parentNew) {
                                indx = pq.moveItem(node, parentNew[childstr], indxOld, indx)
                            } else {
                                parentNew[childstr].splice(indx++, 0, node);
                                parentOld[childstr].splice(indxOld, 1)
                            }
                        }
                    }
                    if (sibling) {
                        GMDI.forEach(function(di) {
                            node[di] = sibling[di]
                        });
                        node[parentIdStr] = sibling[parentIdStr];
                        node[hidden] = sibling[hidden]
                    }
                    if (add) {
                        data.splice(indxDATA++, 0, node)
                    } else {
                        indxOld = data.indexOf(node);
                        if (remove) {
                            data.splice(indxOld, 1)
                        } else {
                            indxDATA = pq.moveItem(node, data, indxOld, indxDATA)
                        }
                        self.removeEmptyParent(parentOld)
                    }
                }
                self.updateItems();
                self.summaryT();
                if (self.isCascade(GM)) {
                    self.cascadeInit();
                    self.setValCBox()
                }
                that.iRefresh.addRowIndx();
                self.initmerge();
                that._trigger((add ? "add" : remove ? "delete" : "move") + "Node");
                that.refresh({
                    header: false
                })
            }
        },
        onCellClick: function(self) {
            return function(evt, ui) {
                if (ui.rowData.pq_gtitle && $(evt.originalEvent.target).hasClass("pq-group-icon")) {
                    if (pq.isCtrl(evt)) {
                        var rd = ui.rowData;
                        self[rd.pq_close ? "expand" : "collapse"](rd.pq_level)
                    } else {
                        self.toggleRow(ui.rowIndxPage, evt)
                    }
                }
            }
        },
        onCellMouseDown: function() {
            return function(evt, ui) {
                if (ui.rowData.pq_gtitle && $(evt.originalEvent.target).hasClass("pq-group-icon")) {
                    evt.preventDefault()
                }
            }
        },
        onCellKeyDown: function(self, GM) {
            return function(evt, ui) {
                if (ui.rowData.pq_gtitle) {
                    if ($.inArray(ui.dataIndx, GM.dataIndx) >= 0 && evt.keyCode === $.ui.keyCode.ENTER) {
                        self.toggleRow(ui.rowIndxPage, evt);
                        return false
                    }
                }
            }
        },
        onChange: function(self, GM) {
            return function(evt, ui) {
                if (GM.source === ui.source || ui.source === "checkbox") {} else {
                    self.summaryT();
                    self.that.refresh()
                }
            }
        },
        onColumnDrag: function(self) {
            return function(evt, ui) {
                var col = ui.column,
                    CM = col.colModel;
                if (CM && CM.length || col.groupable === false || col.denyGroup) {
                    self.acceptDrop = false
                } else {
                    self.initHeadDroppable()
                }
            }
        },
        onCustomSort: function(evt, ui) {
            var self = this,
                that = self.that,
                o = that.options,
                GM = o.groupModel,
                GMdi = GM.dataIndx,
                sorter = ui.sorter,
                di = (sorter[0] || {}).dataIndx,
                column = that.columns[di],
                indexOfDI = GMdi.indexOf(di),
                ci = that.colIndxs[di];
            if (GMdi.length && sorter.length === 1) {
                if (indexOfDI >= 0 && column.groupChange) {
                    return
                }
                if (di === "pq_order" || (column.summary || {}).type) {
                    return self._delaySort(ui)
                } else {
                    var sorter2 = GMdi.map(function(di) {
                        return {
                            dataIndx: di,
                            dir: sorter[0].dir
                        }
                    }).concat(sorter);
                    sorter2 = pq.arrayUnique(sorter2, "dataIndx");
                    return self._delaySort(ui, function(data) {
                        if (GM.titleInFirstCol && ci === 0) {
                            ui.sort_composite = sorter2.map(function(_sorter) {
                                return that.iSort.compileSorter([_sorter], data)
                            })
                        } else {
                            ui.sort_composite = sorter2.map(function(_sorter) {
                                if (_sorter.dataIndx === di) {
                                    return that.iSort.compileSorter([_sorter], data)
                                }
                            })
                        }
                    })
                }
            }
        },
        _delaySort: function(ui, cb) {
            var self = this,
                that = self.that,
                pdata = that.pdata;
            if (pdata && pdata.length) {
                that.one("skipGroup", function() {
                    cb && cb(pdata);
                    ui.data = pdata;
                    self.onCustomSortTree({}, ui);
                    that.pdata = ui.data;
                    self.summaryRestore();
                    return false
                });
                return false
            }
        },
        summaryRestore: function() {
            var self = this,
                childstr = self.childstr,
                that = self.that;

            function _s(titleRows, parent) {
                var data2 = [];
                titleRows.forEach(function(rd) {
                    data2.push(rd);
                    _s(rd[childstr] || [], rd).forEach(function(_rd) {
                        data2.push(_rd)
                    })
                });
                if (parent && parent.pq_child_sum) {
                    data2.push(parent.pq_child_sum)
                }
                return data2
            }
            that.pdata = _s(self.getRoots())
        },
        onDrop: function(that, self) {
            return function(evt, ui) {
                var colIndxDrag = ui.draggable.attr("pq-col-indx") * 1,
                    dataIndx = that.colModel[colIndxDrag].dataIndx;
                self.addGroup(dataIndx);
                self.acceptDrop = false
            }
        },
        onSortable: function(self, o) {
            return function() {
                var arr = [],
                    GMDataIndx = o.groupModel.dataIndx,
                    refresh, $items = $(this).find(".pq-group-item"),
                    $item, dataIndx;
                $items.each(function(i, item) {
                    $item = $(item);
                    dataIndx = $item.data("indx");
                    if (GMDataIndx[i] !== dataIndx) {
                        refresh = true
                    }
                    arr.push(dataIndx)
                });
                if (refresh) {
                    self.option({
                        dataIndx: arr
                    }, "", "", function() {
                        self.triggerChange()
                    })
                }
            }
        },
        onDataReady: function(self, that) {
            return function() {
                var GM = that.options.groupModel,
                    GMLen = GM.dataIndx.length;
                if (GM.on) {
                    if (GMLen || GM.grandSummary) {
                        if (that._trigger("skipGroup") !== false) {
                            self.groupData();
                            self.buildCache()
                        }
                        that.iRefresh.addRowIndx();
                        self.refreshColumns();
                        if (GMLen) {
                            self.initcollapsed();
                            self.initmerge();
                            if (self.isCascade(GM)) {
                                self.cascadeInit()
                            }
                        }
                    } else {
                        self.refreshColumns()
                    }
                    self.setValCBox()
                }
                self.createHeader()
            }
        },
        onColumnOrder: function(self, GM) {
            return function() {
                if (GM.titleInFirstCol) {
                    self.that.refreshView();
                    return false
                } else {
                    self.initmerge()
                }
            }
        },
        option: function(ui, refresh, source, fn) {
            var di = ui.dataIndx,
                that = this.that,
                diLength = di ? di.length : 0,
                iGV = this,
                o = that.options,
                GM = o.groupModel,
                oldGM, GMdataIndx = GM.dataIndx;
            if (GM.on && GMdataIndx.length && (ui.on === false || diLength === 0)) {
                iGV.showRows()
            }
            oldGM = $.extend({}, GM);
            $.extend(GM, ui);
            if (fn) fn();
            iGV.init();
            iGV.setOption();
            that._trigger("groupOption", null, {
                source: source,
                oldGM: oldGM
            });
            if (refresh !== false) {
                that.refreshView()
            }
        },
        showRows: function() {
            this.that.options.dataModel.data.forEach(function(rd) {
                if (rd.pq_hidden) {
                    rd.pq_hidden = undefined
                }
            })
        },
        renderBodyCell: function(o, GM) {
            var self = this,
                checkbox = GM.checkbox,
                level = GM.dataIndx.length - (self.isPivot() ? 1 : 0),
                titleInFirstCol = GM.titleInFirstCol,
                _indent = titleInFirstCol ? GM.indent : 0,
                indent = _indent * level,
                arrCB, chk = "";
            if (level) indent += _indent;
            return function(ui) {
                var rd = ui.rowData,
                    title, useLabel, column = ui.column,
                    render = column.renderLabel;
                if (ui.Export) {
                    return
                } else {
                    title = render && render.call(self.that, ui);
                    title = title || ui.formatVal || ui.cellData;
                    if (checkbox && titleInFirstCol) {
                        arrCB = self.renderCB(checkbox, rd, GM.cbId);
                        if (arrCB) {
                            chk = arrCB[0]
                        }
                    }
                    useLabel = chk && (column.useLabel || GM.useLabel);
                    return {
                        text: (useLabel ? "<label style='width:100%;'>" : "") + chk + (title === null ? "" : title) + (useLabel ? "</label>" : ""),
                        style: "text-indent:" + indent + "px;"
                    }
                }
            }
        },
        renderCell: function(o, GM) {
            var renderTitle = this.renderTitle(o, GM),
                that = this.that,
                GMDataIndx = GM.dataIndx,
                obj = pq.objectify(this.isPivot() ? GMDataIndx.slice(0, GMDataIndx.length - 1) : GMDataIndx),
                renderBodyCell = this.renderBodyCell(o, GM),
                renderSummary = this.renderSummary(o);
            return function(column, isTitle) {
                column._render = column._renderG = function(ui) {
                    var rd = ui.rowData,
                        gtitle = rd.pq_gtitle;
                    if (isTitle && gtitle) {
                        return renderTitle(ui)
                    } else if (gtitle || rd.pq_gsummary) {
                        return renderSummary(ui)
                    } else if (GM.titleInFirstCol) {
                        if (ui.colIndx === that.getFirstVisibleCI()) return renderBodyCell(ui)
                    }
                }
            }
        },
        renderSummary: function(o) {
            var that = this.that,
                GMDI = o.groupModel.dataIndx;
            return function(ui) {
                var rd = ui.rowData,
                    val, column = ui.column,
                    summary = column.summary,
                    type, title;
                if (summary && (type = summary[GMDI[rd.pq_level]] || summary.type)) {
                    title = o.summaryTitle[type];
                    if (typeof title === "function") {
                        return title.call(that, ui)
                    } else {
                        val = ui.formatVal;
                        if (val === null) {
                            val = ui.cellData;
                            val = val === null ? "" : val
                        }
                        if (typeof val === "number" && !column.format && parseInt(val) !== val) {
                            val = val.toFixed(2)
                        }
                        if (title) {
                            return title.replace("{0}", val)
                        } else {
                            return val
                        }
                    }
                }
            }
        },
        updateformatVal: function(GM, ui, level) {
            var di = GM.dataIndx[level],
                column = this.that.columns[di];
            if (column.format && column !== ui.column) {
                ui.formatVal = pq.format(column, ui.cellData)
            }
        },
        renderTitle: function(o, GM) {
            var self = this,
                that = self.that,
                checkbox = GM.checkbox,
                BS = o.bootstrap,
                clsArr = ["pq-group-title-cell"],
                titleInFirstCol = GM.titleInFirstCol,
                indent = GM.indent,
                bts_on = BS.on,
                icon = bts_on ? BS.groupModel.icon : GM.icon,
                icons = bts_on ? ["glyphicon " + icon[0], "glyphicon " + icon[1]] : ["ui-icon " + icon[0], "ui-icon " + icon[1]],
                arrCB, chk;
            return function(ui) {
                var rd = ui.rowData,
                    column = ui.column,
                    useLabel = column.useLabel,
                    collapsed, level, title, clsIcon, indx;
                if (ui.cellData !== null) {
                    collapsed = rd.pq_close;
                    level = rd.pq_level;
                    title = GM.title;
                    self.updateformatVal(GM, ui, level);
                    title = column.renderLabel || title[level] || GM.titleDefault;
                    title = typeof title === "function" ? title.call(that, ui) : title.replace("{0}", ui.formatVal || ui.cellData).replace("{1}", rd.pq_items);
                    title = title === null ? ui.formatVal || ui.cellData : title;
                    indx = collapsed ? 1 : 0;
                    clsIcon = "pq-group-icon " + icons[indx];
                    if (ui.Export) {
                        return title
                    } else {
                        if (checkbox && titleInFirstCol && self.isCascade(GM)) {
                            arrCB = self.renderCB(checkbox, rd, GM.cbId);
                            if (arrCB) {
                                chk = arrCB[0];
                                if (arrCB[1]) clsArr.push(arrCB[1])
                            }
                        }
                        useLabel = chk && (useLabel !== null ? useLabel : GM.useLabel);
                        return {
                            text: [useLabel ? "<label style='width:100%;'>" : "", "<span class='", clsIcon, "'></span>", chk, title, useLabel ? "</label>" : ""].join(""),
                            cls: clsArr.join(" "),
                            style: "text-align:left;text-indent:" + indent * level + "px;"
                        }
                    }
                }
            }
        },
        triggerChange: function() {
            this.that._trigger("groupChange")
        },
        removeGroup: function(dataIndx) {
            var self = this;
            self.option({
                dataIndx: self.that.options.groupModel.dataIndx.filter(function(di) {
                    return di !== dataIndx
                })
            }, "", "", function() {
                self.triggerChange()
            })
        },
        refreshColumns: function() {
            var that = this.that,
                o = that.options,
                GM = o.groupModel,
                GM_on = GM.on,
                fixCols = GM.fixCols,
                renderCell = this.renderCell(o, GM),
                column, csummary, groupIndx = GM.dataIndx,
                groupIndxLen = groupIndx.length,
                colIndx, CM = that.colModel,
                i = CM.length;
            while (i--) {
                column = CM[i];
                if (column._renderG) {
                    delete column._render;
                    delete column._renderG
                }
                if (column._nodrag) {
                    delete column._nodrag;
                    delete column._nodrop
                }
                if (GM_on && (csummary = column.summary) && csummary.type) {
                    renderCell(column)
                }
            }
            o.geditor = GM_on ? this.editorSummary(o, GM) : undefined;
            if (GM_on) {
                if (GM.titleInFirstCol) {
                    column = this.firstCol();
                    renderCell(column, true)
                } else {
                    for (i = groupIndxLen - 1; i >= 0; i--) {
                        column = that.getColumn({
                            dataIndx: groupIndx[i]
                        });
                        renderCell(column, true)
                    }
                }
            }
            if (fixCols && GM_on) {
                for (i = 0; i < groupIndxLen; i++) {
                    colIndx = that.getColIndx({
                        dataIndx: groupIndx[i]
                    });
                    column = CM[colIndx];
                    column._nodrag = column._nodrop = true;
                    if (colIndx !== i) {
                        that.iDragColumns.moveColumn(colIndx, i, true);
                        that.refreshCM(null, {
                            group: true
                        })
                    }
                }
            }
        },
        saveState: function(refresh) {
            var that = this.that,
                cache = this.cacheClose = this.cacheClose || {},
                idstr = this.id,
                GM = that.options.groupModel;
            if (GM.on && GM.dataIndx.length) {
                that.pdata.forEach(function(rd) {
                    if (rd.pq_gtitle) cache[rd[idstr]] = rd.pq_close
                });
                if (refresh) {
                    this.refreshView("group")
                }
            }
        },
        setSumCols: function(GMdataIndx) {
            var sumCols = [],
                sumDIs = [];
            GMdataIndx = pq.objectify(GMdataIndx);
            this.that.colModel.forEach(function(column) {
                var summary = column.summary,
                    di;
                if (summary && summary.type) {
                    di = column.dataIndx;
                    if (!GMdataIndx[di]) {
                        sumCols.push(column);
                        sumDIs.push(di)
                    }
                }
            });
            this._sumCols = sumCols;
            this._sumDIs = sumDIs;
            return [sumCols, sumDIs]
        },
        setOption: function() {
            var self = this;
            if (self._init) {
                self.refreshColumns();
                self.summaryData.length = 0;
                self.initmerge()
            }
        },
        softRefresh: function() {
            var self = this,
                that = self.that;
            self.pdata = null;
            that.pdata.forEach(function(rd) {
                delete rd.pq_hidden
            });
            self.initcollapsed();
            self.initmerge();
            that.refresh({
                header: false
            })
        },
        toggleLevel: function(dataIndx, evt) {
            var GM = this.that.options.groupModel,
                collapsed = GM.collapsed,
                level = $.inArray(dataIndx, GM.dataIndx),
                all = pq.isCtrl(evt) ? "All" : "",
                close = collapsed[level];
            this[(close ? "expand" : "collapse") + all](level)
        },
        trigger: function(ui) {
            var evt = ui.evt,
                rd = ui.rd,
                _level = ui.level,
                all = ui.all,
                close = ui.close,
                that = this.that,
                level, di, val, i, GM = that.options.groupModel,
                groupIndx = GM.dataIndx,
                collapsed = GM.collapsed,
                _before = cGroup.beforeTrigger(evt, that),
                state = {};
            if (rd) {
                level = rd.pq_level;
                di = groupIndx[level], val = rd[di];
                close = !rd.pq_close;
                state = {
                    level: level,
                    close: close,
                    group: val
                };
                if (_before(state)) {
                    return false
                }
                rd.pq_close = close
            } else if (all) {
                state = {
                    all: true,
                    close: close,
                    level: _level
                };
                if (_before(state)) {
                    return false
                }
                for (i = _level; i < groupIndx.length; i++) {
                    collapsed[i] = close
                }
            } else if (_level !== null) {
                state = {
                    level: _level,
                    close: close
                };
                if (_before(state)) {
                    return false
                }
                collapsed[_level] = close
            }
            return that._trigger("group", null, state)
        },
        toggleRow: function(rip, evt) {
            var that = this.that,
                pdata = that.pdata,
                rd = pdata[rip];
            if (this.trigger({
                    evt: evt,
                    rd: rd
                }) !== false) {
                this.softRefresh()
            }
        }
    });
    var fn = _pq.pqGrid.prototype;
    fn.Group = function(ui) {
        var iGV = this.iGroup;
        if (ui === null) {
            return iGV
        } else {
            iGV.expandTo(ui.indx)
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        _pgrid = _pq.pqGrid.prototype,
        pq_options = _pgrid.options;
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iDrag = new cDnD(grid)
    });
    var cDnD = _pq.cDrag = function(grid) {
        var self = this,
            o = grid.options,
            m = o.dragModel;
        if (m.on) {
            self.that = grid;
            o.postRenderInterval = o.postRenderInterval || -1;
            self.model = m;
            self.ns = ".pq-drag";
            grid.on("CMInit", self.onCMInit.bind(self)).on("create", self.onCreate.bind(self))
        }
    };
    _pgrid.Drag = function() {
        return this.iDrag
    };
    pq_options.dragModel = {
        afterDrop: function() {},
        beforeDrop: function(evt, uiDrop) {
            var nodes = this.Drag().getUI().nodes,
                obj = this,
                T = this.Tree(),
                G = this.Group();
            if (T.isOn()) obj = T;
            else if (G.isOn()) obj = G;
            obj.deleteNodes(nodes)
        },
        diDrag: -1,
        dragNodes: function(rd) {
            return [rd]
        },
        contentHelper: function(diHelper, dragNodes) {
            var rd = dragNodes[0],
                len = dragNodes.length;
            return diHelper.map(function(di) {
                return rd[di]
            }).join(", ") + (len > 1 ? " ( " + dragNodes.length + " )" : "")
        },
        clsHandle: "pq-drag-handle",
        clsDnD: "pq-dnd",
        iconAccept: "ui-icon ui-icon-check",
        iconReject: "ui-icon ui-icon-cancel",
        tmplDragN: "<span class='ui-icon ui-icon-grip-dotted-vertical pq-drag-handle' style='cursor:move;position:absolute;left:2px;top:4px;'>&nbsp;</span>",
        tmplDrag: "<span class='ui-icon ui-icon-grip-dotted-vertical pq-drag-handle' style='cursor:move;vertical-align:text-bottom;touch-action:none;float:left;'>&nbsp;</span>",
        cssHelper: {
            opacity: .7,
            position: "absolute",
            height: 25,
            width: 200,
            overflow: "hidden",
            background: "#fff",
            border: "1px solid",
            boxShadow: "4px 4px 2px #aaaaaa",
            zIndex: 1001
        },
        tmplHelper: "<div class='pq-border-0 pq-grid-cell' style='pointer-events: none;'>" + "<span class='pq-icon' style='vertical-align:text-bottom;margin:0 5px;'></span>" + "<span></span>" + "</div>"
    };
    cDnD.prototype = {
        addIcon: function(icon) {
            var cls = "pq-icon";
            this.$helper.find("." + cls).attr("class", "").addClass(cls + " " + icon)
        },
        addAcceptIcon: function() {
            this.addIcon(this.model.iconAccept)
        },
        addRejectIcon: function() {
            this.addIcon(this.model.iconReject)
        },
        getHelper: function(evt) {
            var self = this,
                that = self.that,
                m = self.model,
                $cell = $(evt.target).closest(".pq-grid-cell,.pq-grid-number-cell"),
                cellObj = self.cellObj = that.getCellIndices({
                    $td: $cell
                }),
                cell = $cell[0],
                diHelper = m.diHelper || [m.diDrag],
                rd = cellObj.rowData,
                dragNodes = cellObj.nodes = m.dragNodes.call(that, rd, evt),
                html = m.contentHelper.call(that, diHelper, dragNodes),
                $helper = self.$helper = $(m.tmplHelper);
            $helper.find("span:eq(1)").html(html);
            self.addRejectIcon();
            $helper.addClass("pq-theme pq-drag-helper").css(m.cssHelper).data("Drag", self);
            return $helper[0]
        },
        getUI: function() {
            return this.cellObj
        },
        grid: function() {
            return this.that
        },
        isSingle: function() {
            return this.getData().length === 1
        },
        onCMInit: function() {
            var grid = this.that,
                m = this.model,
                str = m.tmplDragN,
                isDraggable = m.isDraggable,
                col = grid.columns[m.diDrag];
            (col || grid.options.numberCell).postRender = function(ui) {
                if (!isDraggable || isDraggable.call(grid, ui)) $(ui.cell).prepend(str)
            }
        },
        onCreate: function() {
            var self = this,
                m = self.model,
                numberDrag = m.diDrag === -1;
            self.that.on(true, "cellMouseDown", self.onCellMouseDown.bind(self));
            self.ele = self.that.$cont.children(":first").addClass(m.clsDnD + (numberDrag ? " pq-drag-number" : "")).draggable($.extend({
                cursorAt: {
                    left: 2,
                    top: 20
                },
                containment: "document",
                appendTo: "body"
            }, m.options, {
                handle: "." + m.clsHandle,
                helper: self.getHelper.bind(self),
                revert: self.revert.bind(self)
            }))
        },
        onDrop: function(evtName, evt, ui) {
            this.model[evtName].call(this.that, evt, ui)
        },
        revert: function(dropped) {
            if (!dropped) this.$helper.hide("explode", function() {
                $(this).remove()
            })
        },
        onCellMouseDown: function(evt) {
            var self = this,
                m = self.model,
                $target = $(evt.originalEvent.target);
            if ($target.closest("." + m.clsHandle + ",.pq-grid-number-cell").length) {
                evt.preventDefault()
            }
        },
        over: function(evt, ui) {
            this.addAcceptIcon()
        },
        out: function(evt, ui) {
            this.addRejectIcon()
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        _pgrid = _pq.pqGrid.prototype,
        pq_options = _pgrid.options;
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iDrop = new cDnD(grid)
    });
    _pgrid.Drop = function() {
        return this.iDrop
    };
    pq_options.dropModel = {
        accept: ".pq-dnd",
        drop: function(evt, uiDrop) {
            var Drag = uiDrop.helper.data("Drag"),
                grid = this,
                G = grid.Group(),
                T = grid.Tree(),
                rdDrop = uiDrop.rowData,
                top = uiDrop.ratioY() <= .5,
                rowIndx = uiDrop.rowIndx + (top ? 0 : 1),
                fn = function(G) {
                    var parent;
                    if (G.isFolder(rdDrop)) {
                        parent = rdDrop;
                        if (!top) indx = 0
                    } else {
                        parent = G.getParent(rdDrop);
                        indx = G.getChildren(parent).indexOf(rdDrop) + (top ? 0 : 1)
                    }
                    if (sameGrid) G.moveNodes(nodes, parent, indx);
                    else {
                        G.addNodes(nodes, parent, indx)
                    }
                };
            if (Drag) {
                var uiDrag = Drag.getUI(),
                    indx, sameGrid = Drag.grid() === grid,
                    nodes = uiDrag.nodes;
                if (G.isOn()) {
                    fn(G)
                } else if (T.isOn()) {
                    fn(T)
                } else {
                    if (sameGrid) grid.moveNodes(nodes, rowIndx);
                    else {
                        grid.addNodes(nodes, rowIndx)
                    }
                }
            }
        }
    };
    var cDnD = _pq.cDrop = function(grid) {
        var self = this,
            o = grid.options,
            m = o.dropModel;
        self.model = m;
        if (m.on) {
            self.that = grid;
            self.ns = ".pq-drop";
            grid.on("create", self.onCreate.bind(self))
        }
    };
    cDnD.prototype = {
        addUI: function(ui, evt, $cell) {
            var self = this;
            ui.$cell = $cell;
            ui.ratioY = function() {
                return self.ratioY(evt, $cell)
            };
            $.extend(ui, self.that.getCellIndices({
                $td: $cell
            }))
        },
        callFn: function(fn, evt, ui) {
            var fn2 = this.model[fn];
            if (fn2) return fn2.call(this.that, evt, ui)
        },
        feedback: function(evt, $cell) {
            if ($cell.length) {
                var self = this,
                    arr = self.getCellY($cell),
                    y1 = arr[0],
                    $cont = self.that.$cont,
                    ratioY = self.ratioY(evt, $cell),
                    contLeft = $cont.offset().left,
                    y2 = arr[1];
                self.$feedback = self.$feedback || self.newF();
                self.$feedback.css({
                    top: ratioY <= .5 ? y1 - 1 : y2 - 1,
                    left: contLeft,
                    width: $cont[0].clientWidth,
                    zIndex: 1e4
                });
                $cont.css("cursor", "copy")
            }
        },
        getCell: function($ele) {
            return $ele.closest(".pq-grid-cell,.pq-grid-number-cell")
        },
        getCellY: function($cell) {
            var pos = $cell.offset(),
                y1 = pos.top,
                y2 = y1 + $cell[0].offsetHeight;
            return [y1, y2]
        },
        getDrag: function(ui) {
            return ui.helper.data("Drag")
        },
        isOn: function() {
            return this.model.on
        },
        isOver: function() {},
        newF: function() {
            return $("<svg class='pq-border-0' style='box-sizing: border-box;position:absolute;border-width:2px;border-style:solid;pointer-events:none;height:0;'></svg>").appendTo(document.body)
        },
        onCreate: function() {
            var self = this;
            self.that.$cont.droppable($.extend({
                tolerance: "pointer"
            }, self.model.options, {
                accept: self.model.accept,
                over: self.onOver.bind(self),
                out: self.onOut.bind(self),
                drop: self.onDrop.bind(self)
            }))
        },
        onOver: function(evt, ui) {
            var self = this,
                Drag = self.Drag = self.getDrag(ui);
            ui.draggable.on("drag.pq", self.onDrag.bind(self));
            if (Drag) {
                Drag.over(evt, ui)
            }
            self.isOver = function() {
                return true
            };
            self.callFn("over", evt, ui)
        },
        onOut: function(evt, ui) {
            ui.draggable.off("drag.pq");
            this.removeFeedback();
            var Drag = this.getDrag(ui);
            if (Drag) {
                Drag.out(evt, ui)
            }
            this.isOver = function() {};
            this.callFn("out", evt, ui)
        },
        onDrag: function(evt, ui) {
            var self = this,
                $ele = pq.elementFromXY(evt),
                $cell = self.getCell($ele),
                Drag = self.Drag,
                isDeny = function() {
                    self.denyDrop = self.callFn("isDroppable", evt, ui) === false;
                    if (self.denyDrop) {
                        if (Drag) Drag.out();
                        self.removeFeedback()
                    } else {
                        if (Drag) Drag.over();
                        self.feedback(evt, $cell)
                    }
                };
            if ($cell.length || self.that.$cont[0].contains($ele[0])) {
                self.addUI(ui, evt, $cell);
                if (ui.rowData) {
                    isDeny()
                }
            }
        },
        onDropX: function(evt, ui) {
            var self = this,
                that = self.that,
                draggable = ui.draggable,
                inst, Drag = ui.helper.data("Drag"),
                fn = function(evtName) {
                    if (Drag && Drag.grid() !== that) Drag.onDrop(evtName, evt, ui);
                    else {
                        try {
                            inst = draggable.draggable("instance");
                            inst.options[evtName].call(draggable[0], evt, ui)
                        } catch (ex) {}
                    }
                };
            fn("beforeDrop");
            self.callFn("drop", evt, ui);
            fn("afterDrop")
        },
        onDrop: function(evt, ui) {
            var self = this,
                $cell, $ele = pq.elementFromXY(evt);
            self.onOut(evt, ui);
            if (!self.denyDrop) {
                $cell = self.getCell($ele);
                if ($cell.length || self.that.$cont[0].contains($ele[0])) {
                    self.addUI(ui, evt, $cell);
                    self.onDropX(evt, ui)
                }
            }
        },
        onMouseout: function() {
            this.removeFeedback()
        },
        onMouseup: function() {
            var self = this;
            self.removeFeedback();
            $(document).off(self.ns);
            self.that.$cont.off(self.ns)
        },
        ratioY: function(evt, $cell) {
            if ($cell.length) {
                var y = evt.pageY,
                    arr = this.getCellY($cell),
                    y1 = arr[0],
                    y2 = arr[1];
                return (y - y1) / (y2 - y1)
            }
        },
        removeFeedback: function() {
            var self = this;
            if (self.$feedback) {
                self.$feedback.remove();
                self.$feedback = null
            }
            self.that.$cont.css("cursor", "")
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    _pq.pqGrid.defaults.contextMenu = {
        init: function(evt, ui) {
            var obj = {
                    r1: ui.rowIndx,
                    c1: ui.colIndx,
                    rc: 1,
                    cc: 1
                },
                S = this.Selection();
            if (S.indexOf(obj) === -1) {
                S.removeAll();
                this.Range(obj).select()
            }
            this.focus(ui)
        }
    };
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iContext = new cContext(grid)
    });
    var cContext = _pq.cContext = function(that) {
        var self = this,
            m = self.model = that.options.contextMenu;
        self.that = that;
        self.ns = ".pq-cmenu";
        that.on("cellRightClick " + (m.head ? "headRightClick" : ""), self.onContext.bind(self)).on("destroy", self.removeMenu.bind(self))
    };
    cContext.prototype = {
        get$Item: function(evt) {
            return $(evt.target).closest(".pq-cmenu-item")
        },
        getItem: function(evt) {
            return this.get$Item(evt).data("item")
        },
        onContextDoc: function(evt) {
            if (!this.getItem(evt)) {
                this.removeMenu()
            }
        },
        onclickDoc: function(evt) {
            var item = this.getItem(evt),
                ret, action;
            if (item) {
                action = item.action;
                if (action) {
                    ret = action.call(this.that, evt, this.ui, item);
                    if (ret !== false) this.removeMenu()
                }
            } else {
                this.removeMenu()
            }
        },
        removeMenu: function() {
            if (this.$menu) {
                this.$menu.remove();
                delete this.$menu;
                $(document.body).off(this.ns)
            }
        },
        removeSubMenu: function(i, node) {
            var strMenu = "subMenu";
            if (node[strMenu]) {
                node[strMenu].remove();
                delete node[strMenu]
            }
        },
        onMouseOver: function(evt) {
            var self = this,
                item = self.getItem(evt),
                $subMenu, strMenu = "subMenu",
                $item = self.get$Item(evt),
                sitems = (item || {}).subItems;
            $item.siblings().each(self.removeSubMenu);
            if (sitems && sitems.length && !$item[0][strMenu]) {
                $subMenu = self.createMenu(sitems);
                $subMenu.position({
                    my: "left top",
                    at: "right top",
                    of: $item,
                    collision: "flipfit"
                });
                $item[0][strMenu] = $subMenu
            }
        },
        onRemove: function(self) {
            return function() {
                $(this).find(".pq-cmenu-item").each(self.removeSubMenu)
            }
        },
        getItemHtml: function(item, i) {
            if (item === "separator") {
                return "<tr class='pq-cmenu-item'><td colspan=4 class='pq-bg-0' style='height:2px;'></td></td>"
            } else {
                var style = item.style,
                    tooltip = item.tooltip,
                    styleStr = style ? 'style="' + style + '"' : "",
                    attr = tooltip ? 'title="' + tooltip + '"' : "";
                return "<tr class='pq-cmenu-item " + (item.disabled ? "pq_disabled" : "") + " " + (item.cls || "") + "' indx=" + i + ">" + "<td><span class='" + (item.icon || "") + "' />" + "</td><td " + styleStr + " " + attr + ">" + item.name + "</td><td>" + (item.shortcut || "") + "</td><td><span class='" + (item.subItems ? "pq-submenu " + "ui-icon ui-icon-carat-1-e" : "") + "' />" + "</td></tr>"
            }
        },
        createMenu: function(items) {
            items = items.filter(function(item) {
                return item !== null
            });
            var self = this,
                html = "",
                $div;
            items.forEach(function(item, i) {
                html += self.getItemHtml(item, i)
            });
            $div = $("<div class='pq-cmenu pq-theme pq-popup'><table>" + html + "</table></div>").appendTo(document.body);
            $div.find(".pq-cmenu-item").each(function(i, item) {
                $(item).data("item", items[i])
            });
            $div.on("mouseover", self.onMouseOver.bind(self)).on("remove", self.onRemove(self));
            return $div
        },
        onContext: function(evt, ui) {
            if (this.model.on) return this.showMenu(evt, ui)
        },
        showMenu: function(evt, ui) {
            var self = this,
                m = self.model,
                that = self.that,
                $menu = self.$menu,
                mitems = m.items,
                items = typeof mitems === "function" ? mitems.call(that, evt, ui) : mitems;
            if ($menu) self.removeMenu();
            if (items && items.length) {
                m.init.call(that, evt, ui);
                self.ui = ui;
                $menu = self.$menu = self.createMenu(items);
                $menu.css({
                    position: "absolute",
                    left: evt.pageX,
                    top: evt.pageY
                });
                $(document.body).on("click" + self.ns, self.onclickDoc.bind(self)).on("contextmenu" + self.ns, self.onContextDoc.bind(self));
                return false
            }
        }
    }
})(jQuery);
(function($) {
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iAnim = new cAnim(grid)
    });
    var _pq = $.paramquery,
        cAnim = _pq.cAnim = function(grid) {
            var self = this,
                model = self.model = grid.options.animModel;
            self.grid = grid;
            if (model.on) {
                grid.on(model.events, self.onBefore.bind(self))
            }
        },
        _pgrid = _pq.pqGrid.prototype,
        pq_options = _pgrid.options;
    _pgrid.Anim = function() {
        return this.iAnim
    };
    pq_options.animModel = {
        duration: 290,
        events: "beforeSortDone beforeFilterDone beforeRowExpandDone beforeGroupExpandDone beforeMoveNode " + "beforeAutoRowHeight beforeValidateDone beforeTreeExpandDone onResizeHierarchy",
        eventsH: "beforeHideColsDone beforeColumnCollapseDone beforeColumnOrderDone beforeFlex columnResize"
    };
    cAnim.prototype = {
        cleanUp: function() {
            (this.data || []).forEach(function(rd) {
                rd.pq_top = rd.pq_hideOld = undefined
            });
            this.data = this.render = null
        },
        isActive: function() {
            return this._active
        },
        onBefore: function(evt, ui) {
            if (evt.isDefaultPrevented() || this.data) {
                return
            }
            var self = this,
                grid = self.grid,
                iR = grid.iRenderB,
                data = self.data = iR.data,
                $rows, render = self.render = [];
            try {
                self.htTbl = iR.dims.htTbl;
                iR.eachV(function(rd, i) {
                    $rows = iR.get$Row(i);
                    rd.pq_render = 1;
                    render.push([rd, $rows.clone(), $rows.map(function(j, row) {
                        return row.parentNode
                    })])
                });
                data.forEach(function(rd, i) {
                    rd.pq_top = iR.getTop(i);
                    rd.pq_hideOld = rd.pq_hidden
                });
                grid.one("refresh", self.oneRefresh.bind(self));
                setTimeout(function() {
                    self.cleanUp()
                })
            } catch (ex) {
                self.data = null
            }
        },
        oneRefresh: function() {
            if (!this.data) {
                return
            }
            var self = this,
                grid = self.grid,
                iR = grid.iRenderB,
                duration = self.model.duration,
                $tbl = $([iR.$tbl_left[0], iR.$tbl_right[0]]),
                htTbl = self.htTbl,
                htTbl2 = iR.dims.htTbl,
                $rows;
            self._active = true;
            if (htTbl > htTbl2) {
                $tbl.css("height", htTbl)
            }
            setTimeout(function() {
                $tbl.css("height", iR.dims.htTbl);
                self._active = false
            }, duration);
            iR.eachV(function(rd, i) {
                delete rd.pq_render;
                var top = iR.getTop(i),
                    topOld = rd.pq_top,
                    obj1, obj2;
                if (topOld !== top || rd.pq_hideOld) {
                    $rows = iR.get$Row(i);
                    if (topOld === null || rd.pq_hideOld) {
                        obj1 = {
                            opacity: 0
                        };
                        obj2 = {
                            opacity: 1
                        }
                    } else {
                        obj1 = {
                            top: topOld
                        };
                        obj2 = {
                            top: top
                        }
                    }
                    $rows.css(obj1).animate(obj2, duration)
                }
            });
            self.render.forEach(self.removeRows.bind(self));
            self.cleanUp()
        },
        removeRows: function(arr) {
            var rd = arr[0],
                $rows, ri = rd.pq_ri,
                top, duration = this.model.duration,
                obj = {
                    opacity: 1,
                    top: rd.pq_top
                };
            if (rd.pq_render) {
                delete rd.pq_render;
                $rows = arr[1].each(function(j, row) {
                    $(row).removeAttr("id").appendTo(arr[2][j]).children().removeAttr("id")
                });
                $rows.css(obj);
                if (ri === null || rd.pq_hidden) {
                    obj = {
                        opacity: 0
                    }
                } else {
                    try {
                        top = this.grid.iRenderB.getTop(ri);
                        obj = {
                            top: top
                        }
                    } catch (ex) {
                        obj = {
                            opacity: 0
                        }
                    }
                }
                $rows.animate(obj, duration, function() {
                    if (this.parentNode) this.parentNode.removeChild(this)
                })
            }
        }
    }
})(jQuery);
(function($) {
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iAnimH = new cAnimH(grid)
    });
    var _pq = $.paramquery,
        cAnimH = _pq.cAnimH = function(grid) {
            var self = this,
                model = self.model = grid.options.animModel;
            self.grid = grid;
            if (model.on) {
                grid.on(model.eventsH, self.onBeforeCol.bind(self))
            }
        },
        _pgrid = _pq.pqGrid.prototype;
    _pgrid.AnimH = function() {
        return this.iAnimH
    };
    cAnimH.prototype = {
        cleanUp: function() {
            (this.data || []).forEach(function(rd) {
                rd.pq_left = rd.pq_hideOld = undefined
            });
            this.data = this.render = null
        },
        get$Col: function() {
            var grid = this.grid,
                iR = grid.iRenderB,
                iRH = grid.iRenderHead,
                iRS = grid.iRenderSum,
                $cellsB = iR.getAllCells(),
                $cellsH = iRH.getAllCells(),
                $cellsS = iRS.getAllCells();
            return function(ci) {
                return iR.get$Col(ci, $cellsB).add(iRH.get$Col(ci, $cellsH)).add(iRS.get$Col(ci, $cellsS))
            }
        },
        onBeforeCol: function(evt) {
            if (evt.isDefaultPrevented() || this.data) {
                return
            }
            var self = this,
                grid = self.grid,
                data = self.data = grid.getColModel(),
                $cols, get$Col = self.get$Col(),
                iR = grid.iRenderB,
                render = self.render = [];
            data.forEach(function(col, i) {
                col.pq_hideOld = col.hidden;
                col.pq_left = iR.getLeft(i)
            });
            iR.eachH(function(col, i) {
                $cols = get$Col(i);
                col.pq_render = 1;
                render.push([col, $cols.clone(), $cols.map(function(j, col) {
                    return col.parentNode.id
                })])
            });
            grid.one("softRefresh refresh", self.oneRefreshCol.bind(self))
        },
        oneRefreshCol: function() {
            if (!this.data) {
                return
            }
            var self = this,
                grid = self.grid,
                iR = grid.iRenderB,
                duration = self.model.duration,
                get$Col = self.get$Col(),
                $cols;
            iR.eachH(function(col, i) {
                delete col.pq_render;
                var left = iR.getLeft(i),
                    leftOld = col.pq_left;
                if (leftOld !== left || col.pq_hideOld) {
                    $cols = get$Col(i);
                    if (leftOld === null) {
                        $cols.css("opacity", 0).animate({
                            opacity: 1
                        }, duration)
                    } else if (col.pq_hideOld) {
                        $cols.css({
                            opacity: 0,
                            left: leftOld
                        }).animate({
                            opacity: 1,
                            left: left
                        }, duration)
                    } else {
                        $cols.css("left", leftOld).animate({
                            left: left
                        }, duration)
                    }
                }
            });
            self.render.forEach(self.removeCols.bind(self));
            self.cleanUp()
        },
        removeCols: function(arr) {
            var self = this,
                col = arr[0],
                $cols, duration = self.model.duration,
                grid = self.grid,
                iR = grid.iRenderB,
                ci = grid.colIndxs[col.dataIndx],
                left, obj;
            if (col.pq_render) {
                delete col.pq_render;
                $cols = arr[1].each(function(j, col) {
                    $(col).removeAttr("id").appendTo(document.getElementById(arr[2][j]))
                });
                if (ci === null || col.hidden) {
                    $cols.css("opacity", 1);
                    obj = {
                        opacity: 0
                    }
                } else {
                    left = iR.getLeft(ci);
                    obj = {
                        left: left
                    }
                }
                $cols.animate(obj, duration, function() {
                    if (this.parentNode) this.parentNode.removeChild(this)
                })
            }
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iFillHandle = new cFillHandle(grid)
    });
    _pq.pqGrid.defaults.fillHandle = "all";
    _pq.pqGrid.defaults.autofill = true;
    var cFillHandle = _pq.cFillHandle = function(that) {
        var self = this;
        self.$wrap;
        self.locked;
        self.sel;
        self.that = that;
        that.on("selectChange", self.onSelectChange(self)).on("selectEnd", self.onSelectEnd(self)).on("assignTblDims", self.onRefresh(self)).on("keyDown", self.onKeyDown.bind(self))
    };
    cFillHandle.prototype = {
        create: function() {
            var self = this;
            if (self.locked) return;
            self.remove();
            var that = self.that,
                area = that.Selection().address();
            if (area.length !== 1) return;
            var area = area[0],
                r2 = area.r2,
                c2 = area.c2,
                ui = {
                    rowIndx: r2,
                    colIndx: c2
                },
                iM = that.iMerge,
                uiM = iM.getRootCellO(r2, c2, true),
                $td = that.getCell(uiM);
            if (!$td.length) return;
            if (that._trigger("beforeFillHandle", null, uiM) !== false) {
                var td = $td[0],
                    tbl = td.parentNode.parentNode,
                    cont = tbl.parentNode,
                    d = 10,
                    left = td.offsetLeft + td.offsetWidth - 5,
                    top = td.parentNode.offsetTop + td.offsetHeight - 5,
                    right = Math.min(left + d, tbl.offsetWidth),
                    left = right - d,
                    bottom = Math.min(top + d, tbl.offsetHeight),
                    top = bottom - d,
                    $wrap = $("<div class='pq-fill-handle'></div>").appendTo(cont);
                $wrap.css({
                    position: "absolute",
                    top: top,
                    left: left,
                    height: d,
                    width: d,
                    background: "#333",
                    cursor: "crosshair",
                    border: "2px solid #fff",
                    zIndex: 1
                });
                self.$wrap = $wrap
            }
        },
        onSelectChange: function(self) {
            return function() {
                self.remove()
            }
        },
        onSelectEnd: function(self) {
            return function() {
                if (this.options.fillHandle) {
                    self.create();
                    self.setDraggable();
                    self.setDoubleClickable()
                }
            }
        },
        onRefresh: function(self) {
            var id;
            return function() {
                if (this.options.fillHandle) {
                    clearTimeout(id);
                    id = setTimeout(function() {
                        if (self.that.element) {
                            self.create();
                            self.setDraggable()
                        }
                    }, 50)
                } else {
                    self.remove()
                }
            }
        },
        remove: function() {
            var $wrap = this.$wrap;
            $wrap && $wrap.remove()
        },
        setDoubleClickable: function() {
            var self = this,
                $wrap = self.$wrap;
            $wrap && $wrap.on("dblclick", self.onDblClick(self.that, self))
        },
        setDraggable: function() {
            var self = this,
                $wrap = self.$wrap,
                $cont = self.that.$cont;
            $wrap && $wrap.draggable({
                helper: function() {
                    return "<div style='height:10px;width:10px;cursor:crosshair;'></div>"
                },
                appendTo: $cont,
                start: function() {
                    self.onStart()
                },
                drag: function(evt) {
                    self.onDrag(evt)
                },
                stop: function() {
                    self.onStop()
                }
            })
        },
        patternDate: function(a) {
            var self = this;
            return function(x) {
                var dateObj = new Date(a);
                dateObj.setDate(dateObj.getDate() + (x - 1));
                return self.formatDate(dateObj)
            }
        },
        formatDate: function(dateObj) {
            return dateObj.getMonth() + 1 + "/" + dateObj.getDate() + "/" + dateObj.getFullYear()
        },
        patternDate2: function(c0, c1) {
            var d0 = new Date(c0),
                d1 = new Date(c1),
                diff, self = this,
                incrDate = d1.getDate() - d0.getDate(),
                incrMonth = d1.getMonth() - d0.getMonth(),
                incrYear = d1.getFullYear() - d0.getFullYear();
            if (!incrMonth && !incrYear || !incrDate && !incrMonth || !incrYear && !incrDate) {
                return function(x) {
                    var dateObj = new Date(c0);
                    if (incrDate) {
                        dateObj.setDate(dateObj.getDate() + incrDate * (x - 1))
                    } else if (incrMonth) {
                        dateObj.setMonth(dateObj.getMonth() + incrMonth * (x - 1))
                    } else {
                        dateObj.setFullYear(dateObj.getFullYear() + incrYear * (x - 1))
                    }
                    return self.formatDate(dateObj)
                }
            }
            d0 = Date.parse(d0);
            diff = Date.parse(d1) - d0;
            return function(x) {
                var dateObj = new Date(d0 + diff * (x - 1));
                return self.formatDate(dateObj)
            }
        },
        getDT: function(cells) {
            var len = cells.length,
                i = 0,
                val, oldDT, dt;
            for (; i < len; i++) {
                val = cells[i];
                if (parseFloat(val) === val) {
                    dt = "number"
                } else if (pq.validation.isDate(val)) {
                    dt = "date"
                }
                if (oldDT && oldDT !== dt) {
                    return "string"
                }
                oldDT = dt
            }
            return dt
        },
        pattern: function(cells) {
            var dt = this.getDT(cells);
            if (dt === "string" || !dt) {
                return false
            }
            var a, b, c, len = cells.length,
                date = dt === "date";
            if (len === 2) {
                if (date) {
                    return this.patternDate2(cells[0], cells[1])
                }
                a = cells[1] - cells[0];
                b = cells[0] - a;
                return function(x) {
                    return a * x + b
                }
            }
            if (len === 3) {
                a = (cells[2] - 2 * cells[1] + cells[0]) / 2;
                b = cells[1] - cells[0] - 3 * a;
                c = cells[0] - a - b;
                return function(x) {
                    return a * x * x + b * x + c
                }
            }
            return false
        },
        autofillVal: function(sel1, sel2, patternArr, xDir) {
            var that = this.that,
                r1 = sel1.r1,
                c1 = sel1.c1,
                r2 = sel1.r2,
                c2 = sel1.c2,
                r21 = sel2.r1,
                c21 = sel2.c1,
                r22 = sel2.r2,
                c22 = sel2.c2,
                val = [],
                k, i, j, sel3, x;
            if (xDir) {
                sel3 = {
                    r1: r1,
                    r2: r2
                };
                sel3.c1 = c21 < c1 ? c21 : c2 + 1;
                sel3.c2 = c21 < c1 ? c1 - 1 : c22;
                x = c21 - c1;
                for (i = c21; i <= c22; i++) {
                    x++;
                    if (i < c1 || i > c2) {
                        k = 0;
                        for (j = r1; j <= r2; j++) {
                            val.push(patternArr[k](x, i));
                            k++
                        }
                    }
                }
            } else {
                sel3 = {
                    c1: c1,
                    c2: c2
                };
                sel3.r1 = r21 < r1 ? r21 : r2 + 1;
                sel3.r2 = r21 < r1 ? r1 - 1 : r22;
                x = r21 - r1;
                for (i = r21; i <= r22; i++) {
                    x++;
                    if (i < r1 || i > r2) {
                        k = 0;
                        for (j = c1; j <= c2; j++) {
                            val.push(patternArr[k](x, i));
                            k++
                        }
                    }
                }
            }
            that.Range(sel3).value(val);
            return true
        },
        autofill: function(sel1, sel2) {
            var that = this.that,
                CM = that.colModel,
                col, dt, cells, di, i, j, obj, data = that.get_p_data(),
                pattern, patternArr = [],
                r1 = sel1.r1,
                c1 = sel1.c1,
                r2 = sel1.r2,
                c2 = sel1.c2,
                xDir = sel2.c1 !== c1 || sel2.c2 !== c2;
            if (xDir) {
                for (i = r1; i <= r2; i++) {
                    obj = {
                        sel: {
                            r: i,
                            c: c1
                        },
                        x: true
                    };
                    that._trigger("autofillSeries", null, obj);
                    if (pattern = obj.series) {
                        patternArr.push(pattern)
                    } else {
                        return
                    }
                }
                return this.autofillVal(sel1, sel2, patternArr, xDir)
            } else {
                for (j = c1; j <= c2; j++) {
                    col = CM[j];
                    dt = col.dataType;
                    di = col.dataIndx;
                    cells = [];
                    for (i = r1; i <= r2; i++) {
                        cells.push(data[i][di])
                    }
                    obj = {
                        cells: cells,
                        sel: {
                            r1: r1,
                            c: j,
                            r2: r2,
                            r: r1
                        }
                    };
                    that._trigger("autofillSeries", null, obj);
                    if (pattern = obj.series || this.pattern(cells, dt)) {
                        patternArr.push(pattern)
                    } else {
                        return
                    }
                }
                return this.autofillVal(sel1, sel2, patternArr)
            }
        },
        onKeyDown: function(evt) {
            if (!this.oldAF && pq.isCtrl(evt)) {
                var self = this,
                    o = self.that.options;
                self.oldAF = o.autofill;
                o.autofill = false;
                $(document.body).one("keyup", function() {
                    o.autofill = self.oldAF;
                    delete self.oldAF
                })
            }
        },
        onStop: function() {
            var self = this,
                that = self.that,
                autofill = that.options.autofill,
                sel1 = self.sel,
                sel2 = that.Selection().address()[0];
            if (sel1.r1 !== sel2.r1 || sel1.c1 !== sel2.c1 || sel1.r2 !== sel2.r2 || sel1.c2 !== sel2.c2) {
                self.locked = false;
                if (!(autofill && self.autofill(sel1, sel2))) {
                    that.Range(sel1).copy({
                        dest: sel2
                    })
                }
            }
        },
        onStart: function() {
            this.locked = true;
            this.sel = this.that.Selection().address()[0]
        },
        onDrag: function(evt) {
            var self = this,
                that = self.that,
                fillHandle = that.options.fillHandle,
                all = fillHandle === "all",
                hor = all || fillHandle === "horizontal",
                vert = all || fillHandle === "vertical",
                x = evt.clientX - 10,
                y = evt.clientY,
                ele = document.elementFromPoint(x, y),
                $td = $(ele).closest(".pq-grid-cell");
            if ($td.length) {
                var cord = that.getCellIndices({
                        $td: $td
                    }),
                    sel = self.sel,
                    r1 = sel.r1,
                    c1 = sel.c1,
                    r2 = sel.r2,
                    c2 = sel.c2,
                    range = {
                        r1: r1,
                        c1: c1,
                        r2: r2,
                        c2: c2
                    },
                    update = function(key, val) {
                        range[key] = val;
                        that.Range(range).select()
                    },
                    ri = cord.rowIndx,
                    ci = cord.colIndx;
                if (all && ri <= r2 && ri >= r1 || hor && !vert) {
                    if (ci > c2) {
                        update("c2", ci)
                    } else if (ci < c1) {
                        update("c1", ci)
                    }
                } else if (vert) {
                    if (ri > r2) {
                        update("r2", ri)
                    } else if (ri < r1) {
                        update("r1", ri)
                    }
                }
            }
        },
        onDblClick: function(that, self) {
            return function() {
                var o = that.options,
                    fillHandle = o.fillHandle;
                if (fillHandle === "all" || fillHandle === "vertical") {
                    var sel = that.Selection().address()[0],
                        rd, c2 = sel.c2,
                        ri = sel.r2 + 1,
                        data = o.dataModel.data,
                        di = that.getColModel()[c2].dataIndx;
                    while (rd = data[ri]) {
                        if (rd[di] === null || rd[di] === "") {
                            ri++
                        } else {
                            ri--;
                            break
                        }
                    }
                    self.onStart();
                    that.Range({
                        r1: sel.r1,
                        c1: sel.c1,
                        r2: ri,
                        c2: c2
                    }).select();
                    self.onStop()
                }
            }
        }
    }
})(jQuery);
(function($) {
    $(document).on("pqGrid:bootup", function(evt, ui) {
        new cScroll(ui.instance)
    });
    var cScroll = $.paramquery.cScroll = function(that) {
        var self = this;
        self.that = that;
        self.ns = ".pqgrid-csroll";
        that.on("create", self.onCreate.bind(self))
    };
    cScroll.prototype = {
        onCreate: function() {
            var self = this,
                that = self.that;
            var drop = that.iDrop && that.iDrop.isOn();
            $(drop ? document : that.$cont).on("mousedown", self.onMouseDown.bind(self))
        },
        onMouseDown: function(evt) {
            var self = this,
                that = self.that,
                $target = $(evt.target),
                $draggable = self.$draggable = $target.closest(".ui-draggable"),
                ns = self.ns;
            if ($draggable.length || $target.closest(that.$cont).length) {
                $(document).on("mousemove" + ns, self[$draggable.length ? "onMouseMove" : "process"].bind(self)).on("mouseup" + ns, self.onMouseUp.bind(self))
            }
        },
        onMouseMove: function(evt) {
            if (this.capture || pq.elementFromXY(evt).closest(this.that.$cont).length && this.that.iDrop.isOver()) {
                this.capture = true;
                this.process(evt)
            }
        },
        onMouseUp: function() {
            $(document).off(this.ns);
            this.capture = false
        },
        process: function(evt) {
            var self = this,
                that = self.that,
                $cont = that.$cont,
                cont_ht = $cont[0].offsetHeight,
                cont_wd = $cont[0].offsetWidth,
                off = $cont.offset(),
                cont_top = off.top,
                cont_left = off.left,
                cont_bot = cont_top + cont_ht,
                cont_right = cont_left + cont_wd,
                pageY = evt.pageY,
                pageX = evt.pageX,
                diffY = pageY - cont_bot,
                diffX = pageX - cont_right,
                diffY2 = cont_top - pageY,
                diffX2 = cont_left - pageX;
            if (pageX > cont_left && pageX < cont_right && (diffY > 0 || diffY2 > 0)) {
                if (diffY > 0) {
                    self.scrollV(diffY, true)
                } else if (diffY2 > 0) {
                    self.scrollV(diffY2)
                }
            } else if (pageY > cont_top && pageY < cont_bot) {
                if (diffX > 0) {
                    self.scrollH(diffX, true)
                } else if (diffX2 > 0) {
                    self.scrollH(diffX2)
                }
            }
        },
        scrollH: function(diff, down) {
            this.scroll(diff, down, true)
        },
        scrollV: function(diff, down) {
            this.scroll(diff, down)
        },
        scroll: function(diff, down, x) {
            var that = this.that,
                iR = that.iRenderB,
                cr = iR.getContRight()[0],
                ht = cr[x ? "scrollWidth" : "scrollHeight"],
                scroll = cr[x ? "scrollLeft" : "scrollTop"],
                factor = ht < 1e3 ? 1 : 1 + (ht - 1e3) / ht;
            diff = Math.pow(diff, factor);
            var scroll2 = scroll + (down ? diff : -diff);
            iR[x ? "scrollX" : "scrollY"](scroll2)
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    _pq.cFormula = function(that) {
        var self = this;
        self.that = that;
        self.oldF = [];
        that.one("ready", function() {
            that.on("CMInit", self.onCMInit(self))
        }).on("dataAvailable", function() {
            self.onDA()
        }).on(true, "change", function(evt, ui) {
            self.onChange(ui)
        })
    };
    _pq.cFormula.prototype = {
        onCMInit: function(self) {
            return function(evt, ui) {
                if (self.isFormulaChange(self.oldF, self.formulas())) {
                    self.calcMainData()
                }
            }
        },
        callRow: function(rowData, formulas, flen) {
            var that = this.that,
                j = 0;
            if (rowData) {
                for (j = 0; j < flen; j++) {
                    var fobj = formulas[j],
                        column = fobj[0],
                        formula = fobj[1];
                    rowData[column.dataIndx] = formula.call(that, rowData, column)
                }
            }
        },
        onDA: function() {
            this.calcMainData()
        },
        isFormulaChange: function(oldF, newF) {
            var diff = false,
                i = 0,
                ol = oldF.length,
                nl = newF.length;
            if (ol === nl) {
                for (; i < ol; i++) {
                    if (oldF[i][1] !== newF[i][1]) {
                        diff = true;
                        break
                    }
                }
            } else {
                diff = true
            }
            return diff
        },
        calcMainData: function() {
            var formulas = this.formulaSave(),
                that = this.that,
                flen = formulas.length;
            if (flen) {
                var o = that.options,
                    data = o.dataModel.data,
                    i = data.length;
                while (i--) {
                    this.callRow(data[i], formulas, flen)
                }
                that._trigger("formulaComputed")
            }
        },
        onChange: function(ui) {
            var formulas = this.formulas(),
                flen = formulas.length,
                self = this,
                fn = function(rObj) {
                    self.callRow(rObj.rowData, formulas, flen)
                };
            if (flen) {
                ui.addList.forEach(fn);
                ui.updateList.forEach(fn)
            }
        },
        formulas: function() {
            var that = this.that,
                arr = [],
                column, formula, formulas = that.options.formulas || [];
            formulas.forEach(function(_arr) {
                column = that.getColumn({
                    dataIndx: _arr[0]
                });
                if (column) {
                    formula = _arr[1];
                    if (formula) {
                        arr.push([column, formula])
                    }
                }
            });
            return arr
        },
        formulaSave: function() {
            var arr = this.formulas();
            this.oldF = arr;
            return arr
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    _pq.pqGrid.defaults.treeModel = {
        cbId: "pq_tree_cb",
        source: "checkboxTree",
        childstr: "children",
        iconCollapse: ["ui-icon-triangle-1-se", "ui-icon-triangle-1-e"],
        iconFolder: ["ui-icon-folder-open", "ui-icon-folder-collapsed"],
        iconFile: "ui-icon-document",
        id: "id",
        indent: 18,
        parentId: "parentId",
        refreshOnChange: true
    };
    _pq.pqGrid.prototype.Tree = function() {
        return this.iTree
    };
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iTree = new cTree(grid)
    });
    var cTree = _pq.cTree = function(that) {
        this.model = "treeModel";
        this.that = that;
        this.fns = {};
        this.init();
        this.cache = {};
        this.di_prev;
        this.chkRows = []
    };
    cTree.prototype = $.extend({}, pq.mixin.ChkGrpTree, pq.mixin.GrpTree, {
        addNodes: function(_nodes, parent, indx) {
            var self = this,
                that = self.that,
                DM = that.options.dataModel,
                data = DM.data,
                parentIdstr = self.parentId,
                childstr = self.childstr,
                idstr = self.id,
                cache = {},
                rowIndx, nodes = [],
                parentId, i = 0,
                len, node, oldCache = self.cache,
                addCache = function(id) {
                    if (oldCache[id]) throw "duplicate id";
                    else cache[id] = 1
                },
                addList = [];
            if (parent) {
                parentId = parent[idstr];
                rowIndx = data.indexOf(parent) + (indx === null ? (parent[childstr] || []).length : indx) + 1
            } else {
                rowIndx = data.length
            }
            _nodes.forEach(function(node) {
                var id = node[idstr];
                if (!cache[id]) {
                    nodes.push(node);
                    addCache(id);
                    parentId !== null && (node[parentIdstr] = parentId);
                    if (node[childstr]) {
                        var chd = self.getChildrenAll(node);
                        chd.forEach(function(ch) {
                            addCache(ch[idstr])
                        });
                        self.copyArray(nodes, chd)
                    }
                }
            });
            len = nodes.length;
            if (len) {
                for (; i < len; i++) {
                    node = nodes[i];
                    addList.push({
                        newRow: node,
                        rowIndx: rowIndx++
                    })
                }
                that._digestData({
                    addList: addList,
                    checkEditable: false,
                    source: "addNodes"
                });
                self.refreshView()
            }
        },
        collapseAll: function(open) {
            this[open ? "expandNodes" : "collapseNodes"](this.that.options.dataModel.data)
        },
        collapseNodes: function(nodes, evt, open) {
            var i = 0,
                that = this.that,
                len = nodes.length,
                node, nodes2 = [],
                ui, close = !open;
            for (; i < len; i++) {
                node = nodes[i];
                if (this.isFolder(node) && this.isCollapsed(node) !== close) {
                    nodes2.push(node)
                }
            }
            if (nodes2.length) {
                ui = {
                    close: close,
                    nodes: nodes2
                };
                if (that._trigger("beforeTreeExpand", evt, ui) !== false) {
                    len = nodes2.length;
                    for (i = 0; i < len; i++) {
                        node = nodes2[i];
                        node.pq_close = close
                    }
                    that._trigger("treeExpand", evt, ui);
                    this.setCascadeInit(false);
                    this.refreshView()
                }
            }
        },
        deleteNodes: function(nodes) {
            var self = this,
                that = self.that,
                i = 0,
                len, rd1, obj = {},
                id = self.id,
                deleteList = [];
            if (nodes) {
                len = nodes.length;
                for (; i < len; i++) {
                    rd1 = nodes[i];
                    self.eachChild(rd1, function(child) {
                        var id2 = child[id];
                        if (!obj[id2]) {
                            obj[id2] = 1;
                            deleteList.push({
                                rowData: child
                            })
                        }
                    })
                }
                that._digestData({
                    deleteList: deleteList,
                    source: "deleteNodes"
                });
                self.refreshView()
            }
        },
        expandAll: function() {
            this.collapseAll(true)
        },
        expandNodes: function(nodes, evt) {
            this.collapseNodes(nodes, evt, true)
        },
        expandTo: function(node) {
            var nodes = [];
            do {
                if (node.pq_close) {
                    nodes.push(node)
                }
            } while (node = this.getParent(node));
            this.expandNodes(nodes)
        },
        exportCell: function(cellData, level) {
            var str = "",
                i = 0;
            for (; i < level; i++) {
                str += "- "
            }
            return str + (cellData === null ? "" : cellData)
        },
        filter: function(data, arrS, iF, FMmode, dataTmp, dataUF) {
            var rd, ret, found, childstr = this.childstr,
                nodes;
            for (var i = 0, len = data.length; i < len; i++) {
                rd = data[i];
                ret = false;
                if (nodes = rd[childstr]) {
                    ret = this.filter(nodes, arrS, iF, FMmode, dataTmp, dataUF);
                    if (ret) {
                        found = true;
                        dataTmp.push(rd)
                    }
                }
                if (!ret) {
                    if (!iF.isMatchRow(rd, arrS, FMmode)) {
                        dataUF.push(rd)
                    } else {
                        found = true;
                        dataTmp.push(rd)
                    }
                }
            }
            return found
        },
        getFormat: function() {
            var self = this,
                data = self.that.options.dataModel.data,
                format = "flat",
                i = 0,
                len = data.length,
                parentId = self.parentId,
                childstr = self.childstr,
                rd, children;
            for (; i < len; i++) {
                rd = data[i];
                if (rd[parentId] !== null) {
                    break
                } else if ((children = rd[childstr]) && children.length) {
                    return self.getParent(children[0]) === rd ? "flat" : "nested"
                }
            }
            return format
        },
        getChildrenAll: function(rd, _data) {
            var childstr = this.childstr,
                nodes = rd[childstr] || [],
                len = nodes.length,
                i = 0,
                rd2, data = _data || [];
            for (; i < len; i++) {
                rd2 = nodes[i];
                data.push(rd2);
                if (rd2[childstr]) {
                    this.getChildrenAll(rd2, data)
                }
            }
            return data
        },
        getLevel: function(rd) {
            return rd.pq_level
        },
        _groupById: function(data, _id, children, groups, level) {
            var self = this,
                gchildren, childstr = self.childstr,
                i = 0,
                len = children.length;
            for (; i < len; i++) {
                var rd = children[i],
                    id = rd[_id];
                rd.pq_level = level;
                data.push(rd);
                if (gchildren = groups[id]) {
                    rd[childstr] = gchildren;
                    self._groupById(data, _id, gchildren, groups, level + 1)
                } else {
                    delete rd[childstr]
                }
            }
        },
        groupById: function(data) {
            var self = this,
                id = self.id,
                pId, parentId = self.parentId,
                groups = {},
                group, data2 = [],
                i = 0,
                len = data.length,
                rd;
            for (; i < len; i++) {
                rd = data[i];
                pId = rd[parentId];
                pId === null && (pId = "");
                if (!(group = groups[pId])) {
                    group = groups[pId] = []
                }
                group.push(rd)
            }
            self._groupById(data2, id, groups[""] || [], groups, 0);
            return data2
        },
        init: function() {
            var self = this,
                that = self.that,
                o = that.options,
                TM = o.treeModel,
                cbId = TM.cbId,
                di = self.dataIndx = TM.dataIndx;
            self.cbId = cbId;
            self.prop = "pq_tree_prop";
            self.id = TM.id;
            self.parentId = TM.parentId;
            self.childstr = TM.childstr;
            self.onCMInit();
            if (di) {
                if (!self._init) {
                    self.on("CMInit", self.onCMInit.bind(self)).on("dataAvailable", self.onDataAvailable(self, that, TM)).on("dataReadyAfter", self.onDataReadyAfter(self, that, TM)).on("beforeCellKeyDown", self.onBeforeCellKeyDown.bind(self)).on("customSort", self.onCustomSortTree.bind(self)).on("customFilter", self.onCustomFilter.bind(self)).on("clearFilter", self.onClearFilter.bind(self)).on("change", self.onChange(self, that, TM)).on("cellClick", self.onCellClick.bind(self)).on("refresh refreshRow", self.onRefresh(self, TM)).on("valChange", self.onCheckbox(self, TM)).on("refreshHeader", self.onRefreshHeader.bind(self)).on("beforeCheck", self.onBeforeCheck.bind(self));
                    self.setCascadeInit(true);
                    self._init = true
                }
            } else if (self._init) {
                this.off();
                self._init = false
            }
            if (self._init) {
                o.groupModel.on = TM.summary
            }
        },
        initData: function() {
            var self = this,
                that = self.that,
                o = that.options,
                DM = o.dataModel;
            DM.data = self[self.getFormat() === "flat" ? "groupById" : "flatten"](DM.data);
            self.buildCache()
        },
        isCollapsed: function(rd) {
            return !!rd.pq_close
        },
        isOn: function() {
            return this.that.options.treeModel.dataIndx !== null
        },
        moveNodes: function(nodes, parentNew, indx) {
            var self = this,
                that = self.that,
                parentIdstr = self.parentId,
                idstr = self.id,
                childstr = self.childstr,
                DM = that.options.dataModel,
                children = parentNew[childstr],
                childrenLen = children.length,
                parentNewId = parentNew[idstr],
                cache = {},
                parentOld, indxOld, nodes2, indx = indx === null || indx >= childrenLen ? childrenLen : indx,
                i = 0,
                len, node;
            nodes.forEach(function(node) {
                cache[node[idstr]] = 1
            });
            nodes2 = nodes.reduce(function(arr, node) {
                if (!cache[node[parentIdstr]]) {
                    arr.push(node)
                }
                return arr
            }, []);
            len = nodes2.length;
            if (len) {
                that._trigger("beforeMoveNode");
                for (; i < len; i++) {
                    node = nodes2[i];
                    parentOld = self.getParent(node);
                    indxOld = parentOld[childstr].indexOf(node);
                    if (parentOld === parentNew) {
                        indx = pq.moveItem(node, parentNew[childstr], indxOld, indx)
                    } else {
                        parentNew[childstr].splice(indx++, 0, node);
                        parentOld[childstr].splice(indxOld, 1)
                    }
                    node[parentIdstr] = parentNewId
                }
                DM.data = self.flatten(self.getRoots());
                that.refreshView();
                that._trigger("moveNode")
            }
        },
        off: function() {
            var obj = this.fns,
                that = this.that,
                key;
            for (key in obj) {
                that.off(key, obj[key])
            }
            this.fns = {}
        },
        on: function(evt, fn) {
            this.fns[evt] = fn;
            this.that.on(evt, fn);
            return this
        },
        onCellClick: function(evt, ui) {
            var self = this;
            if (ui.dataIndx === self.dataIndx && $(evt.originalEvent.target).hasClass("pq-group-icon")) {
                if (pq.isCtrl(evt)) {
                    var rd = ui.rowData;
                    self[rd.pq_close ? "expandAll" : "collapseAll"]()
                } else {
                    self.toggleNode(ui.rowData, evt)
                }
            }
        },
        onBeforeCellKeyDown: function(evt, ui) {
            var self = this,
                that = self.that,
                rd = ui.rowData,
                $inp, di = ui.dataIndx,
                close, keyCode = evt.keyCode,
                KC = $.ui.keyCode;
            if (di === self.dataIndx) {
                if (self.isFolder(rd)) {
                    close = rd.pq_close;
                    if (keyCode === KC.ENTER && !that.isEditable({
                            rowIndx: rd.pq_ri,
                            dataIndx: di
                        }) || !close && keyCode === KC.LEFT || close && keyCode === KC.RIGHT) {
                        self.toggleNode(rd);
                        return false
                    }
                }
                if (keyCode === KC.SPACE) {
                    $inp = that.getCell(ui).find("input[type='checkbox']");
                    if ($inp.length) {
                        $inp.click();
                        return false
                    }
                }
            }
        },
        onChange: function(self, that, TM) {
            return function(evt, ui) {
                var source = ui.source || "",
                    addListLen = ui.addList.length,
                    deleteListLen = ui.deleteList.length;
                if (source.indexOf("checkbox") === -1) {
                    if ((source === "undo" || source === "redo") && (addListLen || deleteListLen)) {
                        self.refreshViewFull()
                    } else if (TM.summary && TM.refreshOnChange && !addListLen && !deleteListLen) {
                        self.summaryT();
                        that.refresh()
                    } else if (source === "addNodes" || source === "deleteNodes") {
                        self.refreshViewFull()
                    }
                }
            }
        },
        onClearFilter: function(evt, ui) {
            ui.data = this.groupById(ui.data);
            return false
        },
        onCustomFilter: function(evt, ui) {
            var self = this,
                that = self.that,
                data = self.groupById(ui.data),
                iF = that.iFilterData,
                arrS = ui.filters,
                dataTmp = [],
                dataUF = [],
                FMmode = ui.mode;
            self.filter(self.getRoots(data), arrS, iF, FMmode, dataTmp, dataUF);
            ui.dataTmp = self.groupById(dataTmp);
            ui.dataUF = dataUF;
            return false
        },
        onDataAvailable: function(self) {
            return function() {
                self.initData()
            }
        },
        onDataReadyAfter: function(self, that, TM) {
            return function() {
                if (TM.summary) {
                    self.summaryT(self)
                }
                self.showHideRows();
                if (self.isCascade(TM)) {
                    self.cascadeInit()
                }
            }
        },
        option: function(ui, refresh) {
            var self = this,
                that = self.that,
                TM = that.options.treeModel,
                di_prev = TM.dataIndx,
                di;
            $.extend(TM, ui);
            di = TM.dataIndx;
            self.setCellRender();
            self.init();
            if (!di_prev && di) {
                self.initData()
            }
            refresh !== false && that.refreshView()
        },
        renderCell: function(self, TM) {
            return function(ui) {
                var rd = ui.rowData,
                    that = self.that,
                    indent = TM.indent,
                    label, column = ui.column,
                    render = column.renderLabel || TM.render,
                    iconCollapse = TM.iconCollapse,
                    checkbox = TM.checkbox,
                    isFolder = self.isFolder(rd),
                    iconCls = self._iconCls(rd, isFolder, TM),
                    level = rd.pq_level || 0,
                    textIndent = level * indent,
                    textIndentLeaf = textIndent + indent * 1,
                    icon, _icon, icon2, clsArr = ["pq-group-title-cell"],
                    attr, styleArr = ["text-indent:", isFolder ? textIndent : textIndentLeaf, "px;"],
                    text = ui.formatVal || ui.cellData,
                    arrCB, chk;
                if (render) {
                    var ret = that.callFn(render, ui);
                    if (ret !== null) {
                        if (typeof ret !== "string") {
                            ret.iconCls && (iconCls = ret.iconCls);
                            ret.text !== null && (text = ret.text);
                            attr = ret.attr;
                            clsArr.push(ret.cls);
                            styleArr.push(ret.style)
                        } else {
                            text = ret
                        }
                    }
                }
                if (ui.Export) {
                    return self.exportCell(text, level)
                } else {
                    if (checkbox) {
                        arrCB = self.renderCB(checkbox, rd, TM.cbId);
                        if (arrCB) {
                            chk = arrCB[0];
                            if (arrCB[1]) clsArr.push(arrCB[1])
                        }
                    }
                    if (isFolder) {
                        _icon = rd.pq_close ? iconCollapse[1] : iconCollapse[0];
                        icon = "<span class='pq-group-icon ui-icon " + _icon + "'></span>"
                    }
                    if (iconCls) {
                        icon2 = "<span class='pq-tree-icon ui-icon " + iconCls + "'></span>"
                    }
                    label = chk && (column.useLabel || TM.useLabel);
                    return {
                        cls: clsArr.join(" "),
                        attr: attr,
                        style: styleArr.join(""),
                        text: [icon, icon2, label ? "<label style='width:100%;'>" : "", chk, text, label ? "</label>" : ""].join("")
                    }
                }
            }
        },
        refreshViewFull: function(full) {
            var self = this,
                DM = self.that.options.dataModel;
            DM.data = self.groupById(DM.data);
            self.buildCache();
            full && self.refreshView()
        },
        _iconCls: function(rd, isFolder, TM) {
            if (TM.icons) {
                var iconFolder;
                if (isFolder && (iconFolder = TM.iconFolder)) {
                    return rd.pq_close ? iconFolder[1] : iconFolder[0]
                } else if (!rd.pq_gsummary) {
                    return TM.iconFile
                }
            }
        },
        setCellRender: function() {
            var self = this,
                that = self.that,
                TM = that.options.treeModel,
                di, column, columns = that.columns;
            TM.summary && that.iGroup.refreshColumns();
            if (di = self.di_prev) {
                column = columns[di];
                column && (column._render = null);
                self.di_prev = null
            }
            if (di = TM.dataIndx) {
                column = columns[di];
                column._render = self.renderCell(self, TM);
                self.di_prev = di
            }
        },
        _showHideRows: function(p_data, _data, _hide) {
            var self = this,
                data = _data || self.getRoots(),
                childstr = self.childstr,
                rd, hidec, hide = _hide || false,
                children, len = data.length,
                i = 0;
            for (; i < len; i++) {
                rd = data[i];
                rd.pq_hidden = hide;
                if (children = rd[childstr]) {
                    hidec = hide || rd.pq_close;
                    self._showHideRows(p_data, children, hidec)
                }
            }
        },
        showHideRows: function() {
            var self = this,
                that = self.that,
                i = 0,
                data = that.get_p_data(),
                len, rd, summary = that.options.treeModel.summary;
            self._showHideRows(data);
            if (summary) {
                data = that.pdata;
                len = data.length;
                for (; i < len; i++) {
                    rd = data[i];
                    if (rd.pq_gsummary) {
                        rd.pq_hidden = self.getParent(rd).pq_hidden
                    }
                }
            }
        },
        toggleNode: function(rd, evt) {
            this[rd.pq_close ? "expandNodes" : "collapseNodes"]([rd], evt)
        }
    })
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        fn = _pq.pqGrid.prototype,
        cRows = function(that) {
            this.that = that;
            var o = that.options;
            this.options = o;
            this.selection = [];
            this.hclass = " pq-state-select " + (o.bootstrap.on ? "" : "ui-state-highlight")
        };
    _pq.cRows = cRows;
    fn.SelectRow = function() {
        return this.iRows
    };
    cRows.prototype = {
        _add: function(row, remove) {
            var that = this.that,
                $tr, rowIndxPage = row.rowIndxPage,
                add = !remove,
                rowData = row.rowData,
                inView = this.inViewRow(rowIndxPage);
            if (!rowData.pq_hidden && inView) {
                $tr = that.getRow(row);
                if ($tr.length) {
                    $tr[add ? "addClass" : "removeClass"](this.hclass);
                    !add && $tr.removeAttr("tabindex")
                }
            }
            rowData.pq_rowselect = add;
            return row
        },
        _data: function(ui) {
            ui = ui || {};
            var that = this.that,
                all = ui.all,
                offset = that.riOffset,
                ri = all ? 0 : offset,
                data = that.get_p_data(),
                len = all ? data.length : that.pdata.length,
                end = ri + len;
            return [data, ri, end]
        },
        add: function(objP) {
            var rows = objP.addList = objP.rows || [{
                rowIndx: objP.rowIndx
            }];
            if (objP.isFirst) {
                this.setFirst(rows[0].rowIndx)
            }
            this.update(objP)
        },
        extend: function(objP) {
            var r2 = objP.rowIndx,
                arr = [],
                i, item, begin, end, r1 = this.getFirst(),
                isSelected;
            if (r1 !== null) {
                isSelected = this.isSelected({
                    rowIndx: r1
                });
                if (isSelected === null) {
                    return
                }
                if (r1 > r2) {
                    r1 = [r2, r2 = r1][0];
                    begin = r1;
                    end = r2 - 1
                } else {
                    begin = r1 + 1;
                    end = r2
                }
                for (i = begin; i <= end; i++) {
                    item = {
                        rowIndx: i
                    };
                    arr.push(item)
                }
                this.update(isSelected ? {
                    addList: arr
                } : {
                    deleteList: arr
                })
            }
        },
        getFirst: function() {
            return this._firstR
        },
        getSelection: function() {
            var that = this.that,
                data = that.get_p_data(),
                rd, i = 0,
                len = data.length,
                rows = [];
            for (; i < len; i++) {
                rd = data[i];
                if (rd && rd.pq_rowselect) {
                    rows.push({
                        rowIndx: i,
                        rowData: rd
                    })
                }
            }
            return rows
        },
        inViewCol: function(ci) {
            var that = this.that,
                options = that.options,
                iR = that.iRenderB,
                fc = options.freezeCols;
            if (ci < fc) {
                return true
            }
            return ci >= iR.initH && ci <= iR.finalH
        },
        inViewRow: function(rowIndxPage) {
            var that = this.that,
                options = that.options,
                iR = that.iRenderB,
                freezeRows = options.freezeRows;
            if (rowIndxPage < freezeRows) {
                return true
            }
            return rowIndxPage >= iR.initV && rowIndxPage <= iR.finalV
        },
        isSelected: function(objP) {
            var rowData = objP.rowData || this.that.getRowData(objP);
            return rowData ? rowData.pq_rowselect === true : null
        },
        isSelectedAll: function(ui) {
            var arr = this._data(ui),
                data = arr[0],
                ri = arr[1],
                end = arr[2],
                rd;
            for (; ri < end; ri++) {
                rd = data[ri];
                if (rd && !rd.pq_rowselect) {
                    return false
                }
            }
            return true
        },
        removeAll: function(ui) {
            this.selectAll(ui, true)
        },
        remove: function(objP) {
            var rows = objP.deleteList = objP.rows || [{
                rowIndx: objP.rowIndx
            }];
            if (objP.isFirst) {
                this.setFirst(rows[0].rowIndx)
            }
            this.update(objP)
        },
        replace: function(ui) {
            ui.deleteList = this.getSelection();
            this.add(ui)
        },
        selectAll: function(_ui, remove) {
            var that = this.that,
                rd, rows = [],
                offset = that.riOffset,
                arr = this._data(_ui),
                data = arr[0],
                ri = arr[1],
                end = arr[2];
            for (; ri < end; ri++) {
                rd = data[ri];
                if (rd) {
                    rows.push({
                        rowIndx: ri,
                        rowIndxPage: ri - offset,
                        rowData: rd
                    })
                }
            }
            this.update(remove ? {
                deleteList: rows
            } : {
                addList: rows
            }, true)
        },
        setFirst: function(v) {
            this._firstR = v
        },
        toRange: function() {
            var areas = [],
                that = this.that,
                data = that.get_p_data(),
                rd, i = 0,
                len = data.length,
                r1, r2;
            for (; i < len; i++) {
                rd = data[i];
                if (rd.pq_rowselect) {
                    if (r1 !== null) {
                        r2 = i
                    } else {
                        r1 = r2 = i
                    }
                } else if (r1 !== null) {
                    areas.push({
                        r1: r1,
                        r2: r2
                    });
                    r1 = r2 = null
                }
            }
            if (r1 !== null) {
                areas.push({
                    r1: r1,
                    r2: r2
                })
            }
            return that.Range(areas)
        },
        toggle: function(ui) {
            this[this.isSelected(ui) ? "remove" : "add"](ui)
        },
        toggleAll: function(ui) {
            this[this.isSelectedAll(ui) ? "removeAll" : "selectAll"](ui)
        },
        update: function(objP, normalized) {
            var self = this,
                that = self.that,
                ui = {
                    source: objP.source
                },
                norm = function(list) {
                    return normalized ? list : that.normalizeList(list)
                },
                addList = norm(objP.addList || []),
                deleteList = norm(objP.deleteList || []);
            addList = addList.filter(function(rObj) {
                return self.isSelected(rObj) === false
            });
            deleteList = deleteList.filter(self.isSelected.bind(self));
            if (addList.length || deleteList.length) {
                ui.addList = addList;
                ui.deleteList = deleteList;
                if (that._trigger("beforeRowSelect", null, ui) === false) {
                    return
                }
                ui.addList.forEach(function(rObj) {
                    self._add(rObj)
                });
                ui.deleteList.forEach(function(rObj) {
                    self._add(rObj, true)
                });
                that._trigger("rowSelect", null, ui)
            }
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iImport = new cImport(grid)
    });
    _pq.pqGrid.prototype.importWb = function(obj) {
        return this.iImport.importWb(obj)
    };
    var cImport = _pq.cImport = function(that) {
        this.that = that
    };
    cImport.prototype = {
        fillRows: function(data, i, obj) {
            var j = data.length;
            for (; j < i; j++) {
                data.push(obj ? {} : [])
            }
        },
        generateCols: function(numCols, columns, CMrow) {
            var toLetter = pq.toLetter,
                CM = [],
                i = 0,
                column1, column2, colWidthDefault = pq.excel.colWidth,
                cells = CMrow ? CMrow.cells : [],
                titles = [];
            cells.forEach(function(cell, i) {
                var indx = cell.indx || i;
                titles[indx] = cell.value
            });
            columns = columns || [];
            columns.forEach(function(col, i) {
                var indx = col.indx || i;
                CM[indx] = {
                    hidden: col.hidden,
                    width: col.width,
                    title: titles[indx] || ""
                }
            });
            numCols = Math.max(numCols, columns.length);
            for (; i < numCols; i++) {
                column1 = CM[i] || {};
                column2 = {
                    title: column1.title || toLetter(i),
                    width: column1.width || colWidthDefault,
                    halign: "center"
                };
                column1.hidden && (column2.hidden = true);
                CM[i] = column2
            }
            return CM
        },
        importS: function(sheet, extraRows, extraCols, keepCM, headerRowIndx) {
            var mergeCells = sheet.mergeCells,
                self = this,
                data = [],
                that = this.that,
                numCols = 0,
                rows = sheet.rows,
                frozenRows = sheet.frozenRows || 0,
                len = rows.length,
                i = 0,
                row, rindx, rd, cindx, di, CMrow, CM = that.options.colModel,
                hriOffset = 0,
                formula, CMExists = CM && CM.length,
                shiftRC = _pq.cFormulas.shiftRC();
            if (headerRowIndx !== null) {
                hriOffset = headerRowIndx + 1;
                CMrow = rows[headerRowIndx];
                rows = rows.slice(hriOffset);
                frozenRows = frozenRows - hriOffset;
                frozenRows = frozenRows > 0 ? frozenRows : 0
            }
            for (i = 0, len = rows.length; i < len; i++) {
                row = rows[i];
                rindx = row.indx || i;
                rd = {};
                if (rindx !== i) {
                    this.fillRows(data, rindx, true)
                }
                row.cells.forEach(function(cell, j) {
                    cindx = cell.indx || j;
                    di = keepCM && CMExists && CM[cindx] ? CM[cindx].dataIndx : cindx;
                    rd[di] = cell.value;
                    self.copyStyle(rd, di, cell);
                    cell.format && self.copyFormat(rd, di, cell.format);
                    formula = cell.formula;
                    if (formula) {
                        self.copyFormula(rd, di, hriOffset ? shiftRC(formula, 0, -hriOffset) : formula)
                    }
                    numCols <= cindx && (numCols = cindx + 1)
                });
                row.hidden && (rd.pq_hidden = true);
                data[rindx] = rd
            }
            sheet.name && that.option("title", sheet.name);
            extraRows && this.fillRows(data, data.length + extraRows, true);
            that.option("dataModel.data", data);
            numCols += extraCols || 0;
            that.refreshCM(this.generateCols(numCols, sheet.columns, CMrow));
            that.option("mergeCells", (mergeCells || []).map(function(mc) {
                var add = pq.getAddress(mc);
                add.r1 -= hriOffset;
                add.r2 -= hriOffset;
                return add
            }).filter(function(mc) {
                return mc.r1 >= 0
            }));
            that.option({
                freezeRows: frozenRows,
                freezeCols: sheet.frozenCols
            });
            that.refreshDataAndView();
            that._trigger("importWb")
        },
        copyFormula: function(rd, di, formula) {
            var pq_fn = rd.pq_fn = rd.pq_fn || {};
            pq_fn[di] = formula
        },
        copyFormat: function(rd, di, format) {
            var pq_format = rd.pq_format = rd.pq_format || {};
            format = pq.isDateFormat(format) ? pq.excelToJui(format) : pq.excelToNum(format);
            pq_format[di] = format
        },
        copyStyle: function(rd, di, cell) {
            var tmp, style = [],
                cellattr;
            (tmp = cell.font) && style.push("font-family:" + tmp);
            (tmp = cell.fontSize) && style.push("font-size:" + tmp + "px");
            (tmp = cell.color) && style.push("color:" + tmp);
            (tmp = cell.bgColor) && style.push("background:" + tmp);
            cell.bold && style.push("font-weight:bold");
            cell.italic && style.push("font-style:italic");
            cell.underline && style.push("text-decoration:underline");
            (tmp = cell.align) && style.push("text-align:" + tmp);
            (tmp = cell.valign) && style.push("vertical-align:" + tmp);
            cell.wrap && style.push("white-space:normal");
            if (style = style.join(";")) {
                cellattr = rd.pq_cellattr = rd.pq_cellattr || {};
                cellattr[di] = {
                    style: style
                }
            }
        },
        importWb: function(obj) {
            var w = obj.workbook,
                sheet = obj.sheet || 0,
                s = w.sheets.filter(function(_sheet, i) {
                    return sheet === i || sheet === _sheet.name
                })[0];
            s && this.importS(s, obj.extraRows, obj.extraCols, obj.keepCM, obj.headerRowIndx)
        }
    }
})(jQuery);
(function($) {
    pq.excelImport = {
        attr: function() {
            var re = new RegExp('([a-z]+)\\s*=\\s*"([^"]*)"', "gi");
            return function(str) {
                str = str || "";
                str = str.slice(0, str.indexOf(">"));
                var attrs = {};
                str.replace(re, function(a, b, c) {
                    attrs[b] = c
                });
                return attrs
            }
        }(),
        cacheStyles: function() {
            var self = this,
                fontSizeDefault, fontDefault, format, $styles = $($.parseXML(self.getStyleText())),
                formats = $.extend(true, {}, self.preDefFormats),
                styles = [],
                fonts = [""],
                fills = ["", ""];
            $styles.find("numFmts>numFmt").each(function(i, numFmt) {
                var $numFmt = $(numFmt),
                    f = $numFmt.attr("formatCode");
                formats[$numFmt.attr("numFmtId")] = f
            });
            $styles.find("fills>fill>patternFill>fgColor[rgb]").each(function(i, fgColor) {
                var color = self.getColor($(fgColor).attr("rgb"));
                fills.push(color)
            });
            $styles.find("fonts>font").each(function(i, font) {
                var $font = $(font),
                    fontSize = $font.find("sz").attr("val") * 1,
                    _font = $font.find("name").attr("val"),
                    color = $font.find("color").attr("rgb"),
                    fontObj = {};
                if (i === 0) {
                    fontSizeDefault = fontSize;
                    fontDefault = _font.toUpperCase();
                    return
                }
                if ($font.find("b").length) fontObj.bold = true;
                if (color) fontObj.color = self.getColor(color);
                if (_font && _font.toUpperCase() !== fontDefault) fontObj.font = _font;
                if (fontSize && fontSize !== fontSizeDefault) fontObj.fontSize = fontSize;
                if ($font.find("u").length) fontObj.underline = true;
                if ($font.find("i").length) fontObj.italic = true;
                fonts.push(fontObj)
            });
            $styles.find("cellXfs>xf").each(function(i, xf) {
                var $xf = $(xf),
                    numFmtId = $xf.attr("numFmtId") * 1,
                    fillId = $xf.attr("fillId") * 1,
                    $align = $xf.children("alignment"),
                    align, valign, wrap, fontId = $xf.attr("fontId") * 1,
                    key, fontObj = fontId ? fonts[fontId] : {},
                    style = {};
                if ($align.length) {
                    align = $align.attr("horizontal");
                    align && (style.align = align);
                    valign = $align.attr("vertical");
                    valign && (style.valign = valign);
                    wrap = $align.attr("wrapText");
                    wrap === "1" && (style.wrap = true)
                }
                if (numFmtId) {
                    format = formats[numFmtId];
                    if (/(?=.*m.*)(?=.*d.*)(?=.*y.*)/i.test(format)) {
                        format = format.replace(/(\[.*\]|[^mdy\/\-\s])/gi, "")
                    }
                    style.format = format
                }
                if (fillId && fills[fillId]) {
                    style.bgColor = fills[fillId]
                }
                for (key in fontObj) {
                    style[key] = fontObj[key]
                }
                styles.push(style)
            });
            self.getStyle = function(s) {
                return styles[s]
            };
            $styles = 0
        },
        getMergeCells: function($sheet) {
            var self = this,
                mergeCells = $sheet.match(/<mergeCell\s+.*?(\/>|<\/mergeCell>)/g) || [];
            return mergeCells.map(function(mc) {
                return self.attr(mc).ref
            })
        },
        getFrozen: function($sheet) {
            var $pane = this.match($sheet, /<pane.*?(\/>|<\/pane>)/, 0),
                attr = this.attr($pane),
                xSplit = attr.xSplit * 1,
                ySplit = attr.ySplit * 1;
            return {
                r: ySplit || 0,
                c: xSplit || 0
            }
        },
        getFormula: function(self) {
            var obj = {},
                shiftRC = $.paramquery.cFormulas.shiftRC();
            return function(children, ri, ci) {
                if (children.substr(0, 2) === "<f") {
                    var f = self.match(children, /^<f.*?>(.*?)<\/f>/, 1),
                        obj2, attr = self.attr(children);
                    if (attr.t === "shared") {
                        if (f) {
                            obj[attr.si] = {
                                r: ri,
                                c: ci,
                                f: f
                            }
                        } else {
                            obj2 = obj[attr.si];
                            f = shiftRC(obj2.f, ci - obj2.c, ri - obj2.r)
                        }
                    }
                    return f
                }
            }
        },
        getCols: function($sheet) {
            var self = this,
                dim = ($sheet.match(/<dimension\s.*?\/>/) || [])[0],
                ref = self.attr(dim || "").ref,
                cols = [],
                $cols = $sheet.match(/<col\s.*?\/>/g) || [],
                c2 = ref ? pq.getAddress(ref).c2 + 1 : $cols.length,
                factor = pq.excel.colRatio;
            for (var j = 0; j < c2; j++) {
                var col = $cols[j],
                    attrs = self.attr(col),
                    min = attrs.min * 1,
                    max = attrs.max * 1,
                    hidden = attrs.hidden * 1,
                    width = attrs.width * 1,
                    _col;
                for (var i = min; i <= max; i++) {
                    _col = {};
                    if (hidden) _col.hidden = true;
                    else _col.width = (width * factor).toFixed(2) * 1;
                    if (i !== cols.length + 1) _col.indx = i - 1;
                    cols.push(_col)
                }
            }
            return cols
        },
        getColor: function(color) {
            return "#" + color.slice(2)
        },
        getPath: function(key) {
            return this.paths[key]
        },
        getPathSheets: function() {
            return this.pathSheets
        },
        getFileTextFromKey: function(key) {
            return this.getFileText(this.getPath(key))
        },
        getFileText: function(path) {
            return this.files[path.replace(/^\//, "")].asText()
        },
        getSheetText: function(sheetNameOrIndx) {
            sheetNameOrIndx = sheetNameOrIndx || 0;
            var path = this.pathSheets.filter(function(path, i) {
                return path.name === sheetNameOrIndx || i === sheetNameOrIndx
            })[0].path;
            return this.getFileText(path)
        },
        getStyleText: function() {
            return this.getFileTextFromKey("st")
        },
        getSI: function(str) {
            var si = [],
                arr, unescapeXml = pq.unescapeXml,
                count = this.attr(this.match(str, /<sst.*?>[\s\S]*?<\/sst>/, 0)).uniqueCount * 1;
            str.replace(/<si>([\s\S]*?)<\/si>/g, function(a, b) {
                arr = [];
                b.replace(/<t.*?>([\s\S]*?)<\/t>/g, function(c, d) {
                    arr.push(d)
                });
                si.push(unescapeXml(arr.join("")))
            });
            if (count && count !== si.length) {
                throw "si misatch"
            }
            return si
        },
        getWorkBook: function(buffer, type, sheets1) {
            var self = this,
                typeObj = {};
            if (type) typeObj[type] = true;
            else if (typeof buffer === "string") typeObj.base64 = true;
            self.files = new JSZip(buffer, typeObj).files;
            this.readPaths();
            this.cacheStyles();
            var pathSS = this.getPath("ss"),
                sheets = [],
                si = pathSS ? this.getSI(this.getFileText(pathSS)) : [];
            self.getPathSheets().forEach(function(obj, i) {
                if (!sheets1 || sheets1.indexOf(i) > -1 || sheets1.indexOf(obj.name) > -1) {
                    var $sheet = self.getFileText(obj.path),
                        $sheetData = self.match($sheet, /<sheetData.*?>(.*?)<\/sheetData>/, 1),
                        s = self.getWorkSheet($sheet, $sheetData, si, obj.name);
                    sheets.push(s)
                }
            });
            delete self.files;
            return {
                sheets: sheets
            }
        },
        getWorkSheet: function($sheet, $sheetData, si, sheetName) {
            var self = this,
                key, cell, f, format, cell2, data = [],
                rd, cells, t, s, v, cr, num_cols = 0,
                cell_children, rattr, cattr, toNumber = pq.toNumber,
                getFormula = this.getFormula(self),
                isEmpty = pq.isEmpty,
                formulas = pq.formulas,
                isDateFormat = pq.isDateFormat,
                mc = self.getMergeCells($sheet),
                rows = $sheetData.match(/<row.*?<\/row>/g) || [],
                row, r, rowr, i = 0,
                rowsLen = rows.length;
            for (; i < rowsLen; i++) {
                rd = {
                    cells: []
                };
                row = rows[i];
                rattr = self.attr(row);
                rowr = rattr.r;
                r = rowr ? rowr - 1 : i;
                r !== i && (rd.indx = r);
                rattr.hidden && (rd.hidden = true);
                cells = row.match(/(<c[^<]*?\/>|<c.*?<\/c>)/g) || [];
                for (var j = 0, cellsLen = cells.length; j < cellsLen; j++) {
                    cell = cells[j];
                    cattr = self.attr(cell);
                    t = cattr.t;
                    cell_children = self.match(cell, /<c.*?>(.*?)(<\/c>)?$/, 1);
                    cell2 = {};
                    if (t === "inlineStr") {
                        v = cell_children.match(/<t><!\[CDATA\[(.*?)\]\]><\/t>/)[1]
                    } else {
                        v = self.match(cell_children, /<v>(.*?)<\/v>/, 1) || undefined;
                        if (v !== null) {
                            if (t === "s") {
                                v = si[v]
                            } else if (t === "str") {
                                v = pq.unescapeXml(v)
                            } else if (t === "b") {
                                v = v === "1"
                            } else {
                                v = formulas.VALUE(v)
                            }
                        }
                    }
                    cr = cattr.r;
                    if (cr) {
                        cr = cr.replace(/\d+/, "");
                        cr = toNumber(cr)
                    } else {
                        cr = j
                    }
                    num_cols = num_cols > cr ? num_cols : cr;
                    v !== undefined && (cell2.value = v);
                    cr !== j && (cell2.indx = cr);
                    f = getFormula(cell_children, r, cr);
                    f && (cell2.formula = pq.unescapeXml(f));
                    s = cattr.s;
                    if (s && (s = this.getStyle(s))) {
                        for (key in s) {
                            cell2[key] = s[key]
                        }
                        format = cell2.format;
                        if (v !== null && !f && format && isDateFormat(format)) {
                            cell2.value = formulas.TEXT(v, "m/d/yyyy")
                        }
                    }!isEmpty(cell2) && rd.cells.push(cell2)
                }
                data.push(rd)
            }
            var sheetData = {
                    rows: data,
                    name: sheetName
                },
                columns = self.getCols($sheet),
                frozen = self.getFrozen($sheet);
            mc.length && (sheetData.mergeCells = mc);
            columns.length && (sheetData.columns = columns);
            frozen.r && (sheetData.frozenRows = frozen.r);
            frozen.c && (sheetData.frozenCols = frozen.c);
            return sheetData
        },
        Import: function(obj, fn) {
            var self = this,
                file = obj.file,
                content = obj.content,
                reader, rnd, url = obj.url,
                cb = function(data, type) {
                    fn(self.getWorkBook(data, obj.type || type, obj.sheets))
                },
                xhr;
            if (url) {
                rnd = "?" + Math.random();
                if (!window.Uint8Array) {
                    JSZipUtils.getBinaryContent(url + rnd, function(err, data) {
                        cb(data, "binary")
                    })
                } else {
                    xhr = new XMLHttpRequest;
                    xhr.open("GET", url + rnd, true);
                    xhr.responseType = "arraybuffer";
                    xhr.onload = function(e) {
                        if (this.status === 200) {
                            cb(xhr.response)
                        }
                    };
                    xhr.send()
                }
            } else if (file) {
                reader = new FileReader;
                reader.onload = function(e) {
                    cb(e.target.result)
                };
                reader.readAsArrayBuffer(file)
            } else if (content) {
                cb(content)
            }
        },
        match: function(str, re, indx) {
            var m = str.match(re);
            return m ? m[indx] : ""
        },
        preDefFormats: {
            1: "0",
            2: "0.00",
            3: "#,##0",
            4: "#,##0.00",
            5: "$#,##0_);($#,##0)",
            6: "$#,##0_);[Red]($#,##0)",
            7: "$#,##0.00_);($#,##0.00)",
            8: "$#,##0.00_);[Red]($#,##0.00)",
            9: "0%",
            10: "0.00%",
            11: "0.00E+00",
            12: "# ?/?",
            13: "# ??/??",
            14: "m/d/yyyy",
            15: "d-mmm-yy",
            16: "d-mmm",
            17: "mmm-yy",
            18: "h:mm AM/PM",
            19: "h:mm:ss AM/PM",
            20: "h:mm",
            21: "h:mm:ss",
            22: "m/d/yyyy h:mm",
            37: "#,##0_);(#,##0)",
            38: "#,##0_);[Red](#,##0)",
            39: "#,##0.00_);(#,##0.00)",
            40: "#,##0.00_);[Red](#,##0.00)",
            45: "mm:ss",
            46: "[h]:mm:ss",
            47: "mm:ss.0",
            48: "##0.0E+0",
            49: "@"
        },
        readPaths: function() {
            var files = this.files,
                $ContentType = $($.parseXML(files["[Content_Types].xml"].asText())),
                paths = this.paths = {
                    wb: "sheet.main",
                    ws: "worksheet",
                    st: "styles",
                    ss: "sharedStrings"
                };
            for (var key in paths) {
                paths[key] = $ContentType.find('[ContentType$="' + paths[key] + '+xml"]').attr("PartName")
            }
            for (key in files) {
                if (/workbook.xml.rels$/.test(key)) {
                    paths["wbrels"] = key;
                    break
                }
            }
            var $wbrels = $(this.getFileTextFromKey("wbrels")),
                $w = $(this.getFileTextFromKey("wb")),
                pathSheets = this.pathSheets = [];
            $w.find("sheet").each(function(i, sheet) {
                var $sheet = $(sheet),
                    rId = $sheet.attr("r:id"),
                    name = $sheet.attr("name"),
                    partial_path = $wbrels.find('[Id="' + rId + '"]').attr("Target"),
                    full_path = $ContentType.find('Override[PartName$="' + partial_path + '"]').attr("PartName");
                pathSheets.push({
                    name: name,
                    rId: rId,
                    path: full_path
                })
            })
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery,
        fn = _pq._pqGrid.prototype;
    fn.exportExcel = function(obj) {
        obj = obj || {};
        obj.format = "xlsx";
        return this.exportData(obj)
    };
    fn.exportCsv = function(obj) {
        obj = obj || {};
        obj.format = "csv";
        return this.exportData(obj)
    };
    fn.exportData = function(obj) {
        var e = new cExport(this, obj);
        return e.Export(obj)
    };
    var cExport = _pq.cExport = function(that, obj) {
        this.that = that
    };
    cExport.prototype = $.extend({
        copyStyle: function(cell, style) {
            var bg, fontSize, font, color, align, valign, arr;
            if (typeof style === "string") {
                arr = style.split(";");
                style = {};
                arr.forEach(function(_style) {
                    if (_style) {
                        arr = _style.split(":");
                        if (arr[0] && arr[1]) style[arr[0].trim()] = arr[1].trim()
                    }
                })
            }(bg = style.background) && (cell.bgColor = bg);
            (fontSize = style["font-size"]) && (cell.fontSize = parseFloat(fontSize));
            (color = style.color) && (cell.color = color);
            style["white-space"] === "normal" && (cell.wrap = true);
            (align = style["text-align"]) && (cell.align = align);
            (valign = style["vertical-align"]) && (cell.valign = valign);
            style["font-weight"] === "bold" && (cell.bold = true);
            (font = style["font-family"]) && (cell.font = font);
            style["font-style"] === "italic" && (cell.italic = true);
            style["text-decoration"] === "underline" && (cell.underline = true)
        },
        getCsvHeader: function(hc, hcLen, CM, separator) {
            var self = this,
                header = [],
                csvRows = [],
                column, cell, title;
            for (var i = 0; i < hcLen; i++) {
                var row = hc[i],
                    laidCell = null;
                for (var ci = 0, lenj = row.length; ci < lenj; ci++) {
                    column = CM[ci];
                    if (column.hidden || column.copy === false) {
                        continue
                    }
                    cell = row[ci];
                    if (i > 0 && cell === hc[i - 1][ci]) {
                        header.push("")
                    } else if (laidCell && ci > 0 && cell === laidCell) {
                        header.push("")
                    } else {
                        title = self.getTitle(cell, ci);
                        title = title ? title.replace(/\"/g, '""') : "";
                        laidCell = cell;
                        header.push('"' + title + '"')
                    }
                }
                csvRows.push(header.join(separator));
                header = []
            }
            return csvRows
        },
        getCSVContent: function(obj, CM, CMLen, hc, hcLen, data, dataLen, remotePage, offset, iMerge, render, iGV, header) {
            var self = this,
                objM, objN, cv, i, j, separator = obj.separator || ",",
                objR, rowData, ri, rip, column, csvRows, response = [];
            csvRows = header ? self.getCsvHeader(hc, hcLen, CM, separator) : [];
            for (i = 0; i < dataLen; i++) {
                rowData = data[i];
                if (rowData.pq_hidden) {
                    continue
                }
                ri = remotePage ? i + offset : i;
                rip = ri - offset;
                objR = {
                    rowIndx: ri,
                    rowIndxPage: rip,
                    rowData: rowData,
                    Export: true
                };
                for (var j = 0; j < CMLen; j++) {
                    column = CM[j];
                    if (!column.hidden && column.copy !== false) {
                        objN = null;
                        objM = null;
                        if (iMerge.ismergedCell(ri, j)) {
                            if (objM = iMerge.isRootCell(ri, j)) {
                                objN = iMerge.getRootCellO(ri, j);
                                objN.Export = true;
                                cv = self.getRenderVal(objN, render, iGV)[0]
                            } else {
                                cv = ""
                            }
                        } else {
                            objR.colIndx = j;
                            objR.column = column;
                            objR.dataIndx = column.dataIndx;
                            cv = self.getRenderVal(objR, render, iGV)[0]
                        }
                        var cellData = (cv === null ? "" : cv) + "";
                        cellData = cellData.replace(/\"/g, '""');
                        response.push('"' + cellData + '"')
                    }
                }
                csvRows.push(response.join(separator));
                response = []
            }
            return "\ufeff" + csvRows.join("\n")
        },
        getExportCM: function(CM, hcLen) {
            return hcLen > 1 ? CM : CM.filter(function(col) {
                return col.copy !== false
            })
        },
        Export: function(obj) {
            if (this.that._trigger("beforeExport", null, obj) === false) {
                return false
            }
            var self = this,
                that = self.that,
                o = that.options,
                ret, GM = o.groupModel,
                remotePage = o.pageModel.type === "remote",
                offset = that.riOffset,
                iGV = that.iRenderB,
                iMerge = that.iMerge,
                hc = that.headerCells,
                hcLen = hc.length,
                CM = that.colModel,
                CMLen = CM.length,
                CMR = self.getExportCM(CM, hcLen),
                CMRLen = CMR.length,
                TM = o.treeModel,
                curPage = GM.on && GM.dataIndx.length || remotePage || TM.dataIndx && TM.summary,
                data = curPage ? that.pdata : o.dataModel.data,
                data = o.summaryData ? data.concat(o.summaryData) : data,
                dataLen = data.length,
                render = obj.render,
                header = !obj.noheader,
                format = obj.format;
            if (format === "xlsx") {
                var w = self.getWorkbook(CMR, CMRLen, hc, hcLen, data, dataLen, remotePage, offset, iMerge, render, iGV, header, obj.sheetName);
                if (that._trigger("workbookReady", null, {
                        workbook: w
                    }) === false) {
                    return w
                }
                if (obj.workbook) {
                    return w
                }
                obj.workbook = w;
                ret = pq.excel.exportWb(obj)
            } else if (format === "json") {
                obj.data = self.getJsonContent(obj, data)
            } else if (format === "csv") {
                obj.data = self.getCSVContent(obj, CM, CMLen, hc, hcLen, data, dataLen, remotePage, offset, iMerge, render, iGV, header)
            } else {
                obj.data = self.getHtmlContent(obj, CM, CMLen, hc, hcLen, data, dataLen, remotePage, offset, iMerge, render, iGV, header)
            }
            ret = ret || self.postRequest(obj);
            that._trigger("exportData", null, obj);
            return ret
        },
        getHtmlHeader: function(hc, hcLen) {
            var self = this,
                header = [],
                cell, colspan, rowspan, title, align;
            for (var i = 0; i < hcLen; i++) {
                var row = hc[i],
                    laidCell = null;
                header.push("<tr>");
                for (var ci = 0, lenj = row.length; ci < lenj; ci++) {
                    cell = row[ci];
                    colspan = cell.colSpan;
                    if (cell.hidden || !colspan || cell.copy === false) {
                        continue
                    }
                    rowspan = cell.rowSpan;
                    if (i > 0 && cell === hc[i - 1][ci]) {} else if (laidCell && ci > 0 && cell === laidCell) {} else {
                        title = self.getTitle(cell, ci);
                        laidCell = cell;
                        align = cell.halign || cell.align;
                        align = align ? "align=" + align : "";
                        header.push("<th colspan=", colspan, " rowspan=", rowspan, " ", align, ">", title, "</th>")
                    }
                }
                header.push("</tr>")
            }
            return header.join("")
        },
        getHtmlBody: function(CM, CMLen, data, dataLen, remotePage, offset, iMerge, render, iGV) {
            var self = this,
                response = [],
                i, j, column, objN, objM, arr, dstyle, objR, rowData, ri, rip, cellData, attr, align;
            for (i = 0; i < dataLen; i++) {
                rowData = data[i];
                if (rowData.pq_hidden) {
                    continue
                }
                ri = remotePage ? i + offset : i;
                rip = ri - offset;
                objR = {
                    rowIndx: ri,
                    rowIndxPage: rip,
                    rowData: rowData,
                    Export: true
                };
                response.push("<tr>");
                for (j = 0; j < CMLen; j++) {
                    column = CM[j];
                    if (column.hidden || column.copy === false) {
                        continue
                    }
                    objN = null;
                    objM = null;
                    attr = "";
                    if (iMerge.ismergedCell(ri, j)) {
                        if (objM = iMerge.isRootCell(ri, j)) {
                            objN = iMerge.getRootCellO(ri, j);
                            objN.Export = true;
                            arr = self.getRenderVal(objN, render, iGV);
                            cellData = arr[0];
                            dstyle = arr[1]
                        } else {
                            continue
                        }
                        attr = "rowspan=" + objM.rowspan + " colspan=" + objM.colspan + " "
                    } else {
                        objR.colIndx = j;
                        objR.column = column;
                        objR.dataIndx = column.dataIndx;
                        arr = self.getRenderVal(objR, render, iGV);
                        cellData = arr[0];
                        dstyle = arr[1]
                    }
                    align = column.align;
                    attr += align ? "align=" + align : "";
                    cellData = cellData === null ? "" : cellData;
                    cellData = pq.newLine(cellData);
                    response.push("<td ", attr, dstyle ? ' style="' + dstyle + '"' : "", ">", cellData, "</td>")
                }
                response.push("</tr>")
            }
            return response.join("")
        },
        getHtmlContent: function(obj, CM, CMLen, hc, hcLen, data, dataLen, remotePage, offset, iMerge, render, iGV, header) {
            var self = this,
                that = self.that,
                cssRules = obj.cssRules || "",
                $tbl = that.element.find(".pq-grid-table"),
                fontFamily = $tbl.css("font-family"),
                fontSize = $tbl.css("font-size"),
                styleTable = "table{empty-cells:show;font-family:" + fontFamily + ";font-size:" + fontSize + ";border-collapse:collapse;}",
                response = [];
            response.push("<!DOCTYPE html><html><head>", '<meta charset="utf-8" />', "<title>", obj.title ? obj.title : "ParamQuery Pro", "</title>", "</head><body>", "<style>", styleTable, "td,th{padding: 5px;border:1px solid #ccc;}", cssRules, "</style>", "<table>");
            response.push(header ? self.getHtmlHeader(hc, hcLen, CM) : "");
            response.push(self.getHtmlBody(CM, CMLen, data, dataLen, remotePage, offset, iMerge, render, iGV));
            response.push("</table></body></html>");
            return response.join("")
        },
        getJsonContent: function(obj, data) {
            function replacer(key, val) {
                if ((key + "").indexOf("pq_") === 0) {
                    return undefined
                }
                return val
            }
            return obj.nostringify ? data : JSON.stringify(data, obj.nopqdata ? replacer : null, obj.nopretty ? null : 2)
        },
        getTitle: function(cell, colIndx) {
            var title = cell.title;
            if (title) {
                if (typeof title === "function") {
                    title = title.call(this.that, {
                        colIndx: colIndx,
                        column: cell,
                        dataIndx: cell.dataIndx,
                        Export: true
                    })
                }
            } else {
                title = ""
            }
            return title
        },
        getXlsMergeCells: function(mc, hcLen, iMerge, dataLen) {
            mc = mc.concat(iMerge.getMergeCells(hcLen, this.curPage, dataLen));
            var mcs = [],
                toLetter = pq.toLetter,
                mcLen = mc.length;
            for (var i = 0; i < mcLen; i++) {
                var obj = mc[i];
                obj = toLetter(obj.c1) + (obj.r1 + 1) + ":" + toLetter(obj.c2) + (obj.r2 + 1);
                mcs.push(obj)
            }
            return mcs
        },
        getXlsCols: function(CM, CMLen) {
            var cols = [],
                col, column, width, i = 0,
                colWidthDefault = pq.excel.colWidth;
            for (; i < CMLen; i++) {
                column = CM[i];
                width = (column._width || colWidthDefault).toFixed(2) * 1;
                col = {};
                width !== colWidthDefault && (col.width = width);
                column.hidden && (col.hidden = true);
                if (!pq.isEmpty(col)) {
                    cols.length !== i && (col.indx = i);
                    cols.push(col)
                }
            }
            return cols
        },
        getXlsHeader: function(hc, hcLen, mc) {
            var self = this,
                rows = [];
            for (var i = 0; i < hcLen; i++) {
                var row = hc[i],
                    cells = [];
                for (var ci = 0, lenj = row.length; ci < lenj; ci++) {
                    var cell = row[ci];
                    if (cell.copy === false) {
                        continue
                    }
                    var colspan = cell.o_colspan,
                        rowspan = cell.rowSpan,
                        title = self.getTitle(cell, ci);
                    if (i > 0 && cell === hc[i - 1][ci]) {
                        title = ""
                    } else if (ci > 0 && cell === hc[i][ci - 1]) {
                        title = ""
                    } else if (colspan > 1 || rowspan > 1) {
                        mc.push({
                            r1: i,
                            c1: ci,
                            r2: i + rowspan - 1,
                            c2: ci + colspan - 1
                        })
                    }
                    cells.push({
                        value: title,
                        bgColor: "#eeeeee"
                    })
                }
                rows.push({
                    cells: cells
                })
            }
            return rows
        },
        getXlsBody: function(CM, CMLen, data, dataLen, remotePage, offset, iMerge, render, iGV, shiftR) {
            var self = this,
                that = self.that,
                mergeCell, i, j, cv, f, value, column, objR, arr, dstyle, rows = [],
                cells, rowData, ri, rip, di, row, cell, cellattr, shiftRC = _pq.cFormulas.shiftRC(that),
                format;
            for (i = 0; i < dataLen; i++) {
                rowData = data[i];
                cells = [];
                ri = remotePage ? i + offset : i;
                rip = ri - offset;
                objR = {
                    rowIndx: ri,
                    rowIndxPage: rip,
                    rowData: rowData,
                    Export: true
                };
                for (j = 0; j < CMLen; j++) {
                    column = CM[j];
                    di = column.dataIndx;
                    cellattr = rowData.pq_cellattr;
                    value = rowData[di];
                    cv = value;
                    f = that.getFormula(rowData, di);
                    mergeCell = false;
                    if (iMerge.ismergedCell(ri, j)) {
                        if (!iMerge.isRootCell(ri, j, "o")) {
                            mergeCell = true
                        }
                    }
                    if (!mergeCell && !f) {
                        objR.colIndx = j;
                        objR.column = column;
                        objR.dataIndx = di;
                        arr = self.getRenderVal(objR, render, iGV);
                        cv = arr[0];
                        dstyle = arr[1]
                    }
                    format = self.getCellFormat(rowData, di) || column.format;
                    cell = {};
                    if (typeof format === "string") {
                        if (pq.isDateFormat(format)) {
                            if (cv !== value && $.datepicker.formatDate(format, new Date(value)) === cv) {
                                cv = value
                            }
                            format = pq.juiToExcel(format)
                        } else {
                            if (cv !== value && pq.formatNumber(value, format) === cv) {
                                cv = value
                            }
                            format = pq.numToExcel(format)
                        }
                        cell.format = format
                    }
                    cv !== undefined && (cell.value = cv);
                    if (cellattr && (cellattr = cellattr[di]) && (cellattr = cellattr.style)) {
                        self.copyStyle(cell, cellattr)
                    }
                    dstyle && self.copyStyle(cell, dstyle);
                    if (f) {
                        if (shiftR) {
                            f = shiftRC(f, 0, shiftR)
                        }
                        cell.formula = f
                    }
                    if (!pq.isEmpty(cell)) {
                        cell.dataIndx = di;
                        cells.length !== j && (cell.indx = j);
                        cells.push(cell)
                    }
                }
                row = {};
                cells.length && (row.cells = cells);
                rowData.pq_hidden && (row.hidden = true);
                if (!pq.isEmpty(row)) {
                    rows.length !== i && (row.indx = i);
                    rows.push(row)
                }
            }
            return rows
        },
        getCellFormat: function(rowData, di) {
            var format = rowData.pq_format;
            return format && format[di]
        },
        getWorkbook: function(CM, CMLen, hc, hcLen, data, dataLen, remotePage, offset, iMerge, render, iGV, header, sheetName) {
            var self = this,
                cols = self.getXlsCols(CM, CMLen),
                mc = [],
                tmp, o = self.that.options,
                fc = o.freezeCols,
                shiftR = header ? hcLen : 0,
                fr = shiftR + (o.freezeRows || 0),
                _header = header ? self.getXlsHeader(hc, hcLen, mc) : [],
                mergeCells = self.getXlsMergeCells(mc, header ? hcLen : 0, iMerge, dataLen),
                body = self.getXlsBody(CM, CMLen, data, dataLen, remotePage, offset, iMerge, render, iGV, shiftR),
                sheet = {
                    columns: cols,
                    rows: _header.concat(body)
                };
            mergeCells.length && (sheet.mergeCells = mergeCells);
            (tmp = _header.length) && (sheet.headerRows = tmp);
            fr && (sheet.frozenRows = fr);
            fc && (sheet.frozenCols = fc);
            (sheetName || (sheetName = o.title)) && (sheet.name = sheetName);
            return {
                sheets: [sheet]
            }
        },
        postRequest: function(obj) {
            var format = obj.format,
                data, decodeBase, url = obj.url,
                filename = obj.filename || "pqGrid";
            if (obj.zip && format !== "xlsx") {
                var zip = new JSZip;
                zip.file(filename + "." + obj.format, obj.data);
                data = zip.generate({
                    type: "base64",
                    compression: "DEFLATE"
                });
                decodeBase = true;
                format = "zip"
            } else {
                decodeBase = obj.decodeBase ? true : false;
                data = obj.data
            }
            if (url) {
                $.ajax({
                    url: url,
                    type: "POST",
                    cache: false,
                    data: {
                        pq_ext: format,
                        pq_data: data,
                        pq_decode: decodeBase,
                        pq_filename: filename
                    },
                    success: function(filename) {
                        url = url + ((url.indexOf("?") > 0 ? "&" : "?") + "pq_filename=" + filename);
                        $(document.body).append("<iframe height='0' width='0' frameborder='0' src=\"" + url + '"></iframe>')
                    }
                })
            }
            return data
        }
    }, pq.mixin.render)
})(jQuery);
var pqEx = pq.excel = {
    _tmpl: {
        rels: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="workbook.xml"/></Relationships>'
    },
    eachRow: function(sheetData, fn) {
        var rows = sheetData.rows,
            i = 0,
            len = rows.length;
        for (; i < len; i++) {
            fn(rows[i], i)
        }
    },
    exportWb: function(obj) {
        var workbook = obj.workbook,
            templates = this._tmpl,
            self = this,
            names = [],
            sheets = workbook.sheets,
            no = sheets.length,
            zip = new JSZip;
        zip.file("[Content_Types].xml", this.getContentTypes(no));
        sheets.forEach(function(sheet, i) {
            var $cols = self.getCols(sheet.columns),
                $frozen = self.getFrozen(sheet.frozenRows, sheet.frozenCols),
                $body = self.getBody(sheet.rows),
                $merge = self.getMergeCells(sheet.mergeCells);
            names.push(sheet.name);
            zip.file("worksheet" + (i + 1) + ".xml", self.getSheet($frozen, $cols, $body, $merge))
        });
        zip.file("workbook.xml", this.getWBook(names));
        zip.file("styles.xml", self.getStyle());
        var rels = zip.folder("_rels");
        rels.file(".rels", templates.rels);
        rels.file("workbook.xml.rels", this.getWBookRels(no));
        if (obj.url) {
            obj.data = zip.generate({
                type: "base64",
                compression: "DEFLATE"
            });
            obj.decodeBase = true;
            return pq.postRequest(obj)
        } else {
            return zip.generate({
                type: obj.type || "blob",
                compression: "DEFLATE"
            })
        }
    },
    eachCell: function(coll, fn, _i) {
        coll.forEach(function(item, i) {
            var items, cell;
            if (items = item.cells) {
                i = item.indx || i;
                for (var j = 0, len = items.length; j < len; j++) {
                    cell = items[j];
                    fn(cell, cell.indx || j, i, _i)
                }
            } else if (items = item.rows) {
                this.eachCell(items, fn, i)
            }
        }, this)
    },
    findIndex: function(items, fn) {
        var indx = items.findIndex(fn),
            item = items[indx];
        return item.indx || indx
    },
    getArray: function(sheetData) {
        var str = [],
            self = this;
        this.eachRow(sheetData, function(row) {
            var rowstr = [];
            row.cells.forEach(function(cell) {
                rowstr.push(self.getCell(cell))
            });
            str.push(rowstr)
        });
        return str
    },
    getBody: function(rows) {
        var self = this,
            formulas = pq.formulas,
            body = [],
            i, j, ri, ci, r, t, s, v, f, cell, cells, value, row, bgColor, color, font, fontSize, align, wrap, valign, bold, italic, uline, rowsLen = rows.length,
            cellsLen, hidden, format, formatFinal;
        for (i = 0; i < rowsLen; i++) {
            row = rows[i];
            cells = row.cells;
            cellsLen = cells.length;
            hidden = row.hidden ? 'hidden="1"' : "";
            ri = (row.indx || i) + 1;
            r = 'r="' + ri + '"';
            body.push("<row " + hidden + " " + r + ">");
            for (j = 0; j < cellsLen; j++) {
                cell = cells[j];
                value = cell.value;
                ci = cell.indx || j;
                t = "";
                s = "";
                r = ci === j ? "" : 'r="' + pq.toLetter(ci) + ri + '"';
                format = cell.format;
                bgColor = cell.bgColor;
                color = cell.color;
                font = cell.font;
                fontSize = cell.fontSize;
                bold = cell.bold;
                italic = cell.italic;
                uline = cell.underline;
                align = cell.align;
                wrap = cell.wrap;
                valign = cell.valign;
                f = cell.formula;
                f = f ? "<f>" + pq.escapeXml(f) + "</f>" : "";
                if (value === null) {
                    v = "<v></v>"
                } else if (value === parseFloat(value) && (value + "").match(/^[0-9,-,\.]*$/g)) {
                    v = "<v>" + value + "</v>"
                } else if (format && formulas.isDate(value)) {
                    v = "<v>" + formulas.VALUE(value) + "</v>"
                } else if (typeof value === "boolean") {
                    v = "<v>" + (value ? "1" : "0") + "</v>";
                    t = 't="b"'
                } else {
                    t = 't="inlineStr"';
                    v = "<is><t><![CDATA[" + value + "]]></t></is>"
                }
                if (format || bgColor || color || fontSize || align || valign || wrap || bold || italic || uline) {
                    s = 's="' + self.getStyleIndx(format, bgColor, color, font, fontSize, align, valign, wrap, bold, italic, uline) + '"'
                }
                body.push("<c " + t + " " + r + " " + s + ">" + f + v + "</c>")
            }
            body.push("</row>")
        }
        return body.join("")
    },
    getCell: function(cell) {
        var f = cell.format,
            v = cell.value;
        return f ? pq.formulas.TEXT(v, f) : v
    },
    getCSV: function(sheetData) {
        var str = [],
            self = this;
        this.eachRow(sheetData, function(row) {
            var rowstr = [];
            row.cells.forEach(function(cell) {
                rowstr.push(self.getCell(cell))
            });
            str.push(rowstr.join(","))
        });
        return str.join("\r\n")
    },
    getColor: function() {
        var colors = {},
            padd = function(val) {
                return val.length === 1 ? "0" + val : val
            };
        return function(color) {
            var m, a, c = colors[color];
            if (!c) {
                if (/^#[0-9,a,b,c,d,e,f]{6}$/i.test(color)) {
                    a = color.replace("#", "")
                } else if (m = color.match(/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i)) {
                    a = padd((m[1] * 1).toString(16)) + padd((m[2] * 1).toString(16)) + padd((m[3] * 1).toString(16))
                }
                if (a && a.length === 6) {
                    c = colors[color] = "ff" + a
                }
            }
            if (c) return c;
            else throw "invalid color: " + color
        }
    }(),
    _getCol: function(cols, min, max, hidden, width) {
        if (width) {
            if (width === this.colWidth && !hidden) {
                return
            }
            width = (width / this.colRatio).toFixed(2) * 1;
            width = ' customWidth="1" width="' + width + '"'
        }
        cols.push('<col min="', min, '" max="', max, '" hidden="', hidden, '"', width, "/>")
    },
    getCols: function(CM) {
        if (!CM || !CM.length) {
            return ""
        }
        var cols = [],
            min, max, oldWidth, oldHidden, col = 0,
            oldCol = 0,
            non_first, i = 0,
            len = CM.length;
        cols.push("<cols>");
        for (; i < len; i++) {
            var column = CM[i],
                hidden = column.hidden ? 1 : 0,
                width = column.width,
                indx = column.indx;
            col = (indx || col) + 1;
            if (oldWidth === width && oldHidden === hidden && col === oldCol + 1) {
                max = col
            } else {
                if (non_first) {
                    this._getCol(cols, min, max, oldHidden, oldWidth);
                    min = null
                }
                max = col;
                min === null && (min = col)
            }
            oldWidth = width;
            oldHidden = hidden;
            oldCol = col;
            non_first = true
        }
        this._getCol(cols, min, max, oldHidden, oldWidth);
        cols.push("</cols>");
        return cols.join("")
    },
    getContentTypes: function(no) {
        var arr = [],
            i = 1;
        for (; i <= no; i++) {
            arr.push('<Override PartName="/worksheet' + i + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>')
        }
        return ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">', '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>', '<Override PartName="/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>', arr.join(""), '<Override PartName="/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>', "</Types>"].join("")
    },
    getFillIndx: function(bgColor) {
        var self = this,
            fs = self.fills = self.fills || {
                length: 2
            };
        return self.getIndx(fs, bgColor)
    },
    getFontIndx: function(color, font, fontSize, bold, italic, uline) {
        var self = this,
            fs = self.fonts = self.fonts || {
                length: 1
            };
        return self.getIndx(fs, (color || "") + "_" + (font || "") + "_" + (fontSize || "") + "_" + (bold || "") + "_" + (italic || "") + "_" + (uline || ""))
    },
    getFormatIndx: function(format) {
        var self = this,
            fs = self.formats = self.formats || {
                length: 164
            };
        return self.numFmtIds[format] || self.getIndx(fs, format)
    },
    getFrozen: function(r, c) {
        r = r || 0;
        c = c || 0;
        var topLeftCell = pq.toLetter(c) + (r + 1);
        return ['<sheetViews><sheetView workbookViewId="0">', '<pane xSplit="', c, '" ySplit="', r, '" topLeftCell="', topLeftCell, '" activePane="bottomLeft" state="frozen"/>', "</sheetView></sheetViews>"].join("")
    },
    getIndx: function(fs, val) {
        var indx = fs[val];
        if (indx === null) {
            indx = fs[val] = fs.length;
            fs.length++
        }
        return indx
    },
    getItem: function(items, indx) {
        var item = items[indx],
            i1 = 0,
            i2, i, iter = 0,
            iindx = item ? item.indx : -1;
        if (iindx === null || indx === iindx) {
            return item
        }
        i2 = iindx === -1 ? items.length - 1 : indx;
        if (i2 >= 0) {
            while (true) {
                iter++;
                if (iter > 20) {
                    throw "not found"
                }
                i = Math.floor((i2 + i1) / 2);
                item = items[i];
                iindx = item.indx;
                if (iindx === indx) {
                    return item
                } else if (iindx > indx) {
                    i2 = i
                } else {
                    i1 = i === i1 ? i + 1 : i
                }
                if (i1 === i2 && i === i1) {
                    break
                }
            }
        }
    },
    getMergeCells: function(mc) {
        mc = mc || [];
        var mcs = [],
            i = 0,
            mcLen = mc.length;
        mcs.push('<mergeCells count="' + mcLen + '">');
        for (; i < mcLen; i++) {
            mcs.push('<mergeCell ref="', mc[i], '"/>')
        }
        mcs.push("</mergeCells>");
        return mcLen ? mcs.join("") : ""
    },
    getWBook: function(names) {
        return ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">', "<bookViews><workbookView /></bookViews><sheets>", names.map(function(name, id) {
            id++;
            return ['<sheet name="', name ? pq.escapeXml(name) : "sheet" + id, '" sheetId="', id, '" r:id="rId', id, '"/>'].join("")
        }).join(""), "</sheets></workbook>"].join("")
    },
    getWBookRels: function(no) {
        var arr = [],
            i = 1;
        for (; i <= no; i++) {
            arr.push('<Relationship Id="rId' + i + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/worksheet' + i + '.xml"/>')
        }
        return ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">', arr.join(""), '<Relationship Id="rId', i, '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="/styles.xml"/>', "</Relationships>"].join("")
    },
    getSheet: function($frozen, $cols, $body, $merge) {
        return ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">', $frozen, $cols, "<sheetData>", $body, "</sheetData>", $merge, "</worksheet>"].join("")
    },
    getStyleIndx: function(format, bgColor, color, font, fontSize, align, valign, wrap, bold, italic, uline) {
        var self = this,
            formatIndx = format ? self.getFormatIndx(format) : "",
            fillIndx = bgColor ? self.getFillIndx(bgColor) : "",
            fontIndx = color || font || fontSize || bold || italic || uline ? self.getFontIndx(color, font, fontSize, bold, italic, uline) : "",
            val = formatIndx + "_" + fillIndx + "_" + fontIndx + "_" + (align || "") + "_" + (valign || "") + "_" + (wrap || ""),
            fs = self.styles = self.styles || {
                length: 1
            };
        return self.getIndx(fs, val)
    },
    getStyle: function() {
        var formats = this.formats,
            color, fontSize, _font, fills = this.fills,
            fonts = this.fonts,
            bold, italic, uline, arr, formatIndx, fillIndx, fontIndx, align, valign, wrap, styles = this.styles,
            applyFill, applyFormat, applyFont, applyAlign, f1 = [],
            fill = [],
            font = [],
            xf = ['<xf numFmtId="0" applyNumberFormat="1"/>'],
            f;
        if (formats) {
            delete formats.length;
            for (f in formats) {
                f1.push('<numFmt numFmtId="' + formats[f] + '" formatCode="' + f + '"/>')
            }
            delete this.formats
        }
        if (fills) {
            delete fills.length;
            for (f in fills) {
                fill.push('<fill><patternFill patternType="solid"><fgColor rgb="' + this.getColor(f) + '"/></patternFill></fill>')
            }
            delete this.fills
        }
        if (fonts) {
            delete fonts.length;
            for (f in fonts) {
                arr = f.split("_");
                color = "<color " + (arr[0] ? 'rgb="' + this.getColor(arr[0]) + '"' : 'theme="1"') + " />";
                _font = '<name val="' + (arr[1] || "Calibri") + '"/>';
                fontSize = '<sz val="' + (arr[2] || 11) + '"/>';
                bold = arr[3] ? "<b/>" : "";
                italic = arr[4] ? "<i/>" : "";
                uline = arr[5] ? "<u/>" : "";
                font.push("<font>", bold, italic, uline, fontSize, color, _font, '<family val="2"/></font>')
            }
            delete this.fonts
        }
        if (styles) {
            delete styles.length;
            for (f in styles) {
                arr = f.split("_");
                formatIndx = arr[0];
                fillIndx = arr[1];
                fontIndx = arr[2];
                align = arr[3];
                valign = arr[4];
                wrap = arr[5];
                applyFill = fillIndx ? ' applyFill="1" fillId="' + fillIndx + '" ' : "";
                applyFont = fontIndx ? ' applyFont="1" fontId="' + fontIndx + '" ' : "";
                applyFormat = formatIndx ? ' applyNumberFormat="1" numFmtId="' + formatIndx + '"' : "";
                align = align ? ' horizontal="' + align + '" ' : "";
                valign = valign ? ' vertical="' + valign + '" ' : "";
                wrap = wrap ? ' wrapText="1" ' : "";
                applyAlign = align || valign || wrap ? ' applyAlignment="1"><alignment ' + align + valign + wrap + "/></xf>" : "/>";
                xf.push("<xf " + applyFormat + applyFill + applyFont + applyAlign)
            }
            delete this.styles
        }
        f1 = f1.join("\n");
        xf = xf.join("\n");
        fill = fill.join("\n");
        font = font.join("");
        return ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">', "<numFmts>", f1, "</numFmts>", "<fonts>", '<font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font>', font, "</fonts>", '<fills><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>', fill, "</fills>", '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>', '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>', "</cellStyleXfs>", "<cellXfs>", xf, "</cellXfs>", '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>', '<dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleLight16"/>', "</styleSheet>"].join("")
    },
    importXl: function() {
        var o = pq.excelImport;
        return o.Import.apply(o, arguments)
    },
    SpreadSheet: function(s) {
        var ss = pqEx.SpreadSheet,
            key;
        if (this instanceof ss === false) {
            return new ss(s)
        }
        for (key in s) {
            this[key] = s[key]
        }
    }
};
pqEx.colRatio = 8;
pqEx.colWidth = pqEx.colRatio * 8.43;
pqEx.numFmtIds = function() {
    var fmt = pq.excelImport.preDefFormats,
        obj = {};
    for (var key in fmt) {
        obj[fmt[key]] = key
    }
    return obj
}();
pq.postRequest = function(obj) {
    var format = obj.format,
        data, decodeBase, url = obj.url,
        filename = obj.filename || "pqGrid";
    if (obj.zip && format !== "xlsx") {
        var zip = new JSZip;
        zip.file(filename + "." + obj.format, obj.data);
        data = zip.generate({
            type: "base64",
            compression: "DEFLATE"
        });
        decodeBase = true;
        format = "zip"
    } else {
        decodeBase = obj.decodeBase ? true : false;
        data = obj.data
    }
    if (url) {
        $.ajax({
            url: url,
            type: "POST",
            cache: false,
            data: {
                pq_ext: format,
                pq_data: data,
                pq_decode: decodeBase,
                pq_filename: filename
            },
            success: function(filename) {
                url = url + ((url.indexOf("?") > 0 ? "&" : "?") + "pq_filename=" + filename);
                $(document.body).append("<iframe height='0' width='0' frameborder='0' src=\"" + url + '"></iframe>')
            }
        })
    }
    return data
};
pqEx.SpreadSheet.prototype = {
    getCell: function(ri, ci) {
        var rows = this.rows || [],
            row = pqEx.getItem(rows, ri) || {
                cells: []
            },
            cell = pqEx.getItem(row.cells, ci);
        return cell
    }
};
(function($) {
    var _pq = $.paramquery;
    _pq.pqGrid.defaults.formulasModel = {
        on: true
    };
    _pq.pqGrid.prototype.getFormula = function(rd, di) {
        var fnW = this.iFormulas.getFnW(rd, di);
        return fnW ? fnW.fn : undefined
    };
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance,
            FM = grid.options.formulasModel;
        if (FM.on) {
            grid.iFormulas = new cFormulas(grid)
        }
    });
    var cFormulas = _pq.cFormulas = function(that) {
        var self = this;
        self.that = that;
        self.fn = {};
        that.on("dataReadyDone", function() {
            self.onDataReadyDone()
        }).on("columnOrder", function() {
            self.onColumnOrder()
        }).on("beforeValidateDone", function(evt, ui) {
            self.onBeforeValidateDone(ui)
        }).on("autofillSeries", function(evt, ui) {
            self.onAutofill(ui)
        }).on("editorBegin", function(evt, ui) {
            self.onEditorBegin(ui)
        }).on("editorEnd", function() {
            self.onEditorEnd()
        }).on("editorKeyUp editorClick", function(evt, ui) {
            self.onEditorKeyUp(evt, ui)
        }).on(true, "change", function(evt, ui) {
            self.onChange(ui)
        })
    };
    $.extend(cFormulas, {
        deString: function(fn, cb, exec) {
            var arr = [];
            fn = fn.replace(/"(([^"]|"")+)"/g, function(a, b) {
                arr.push(b);
                return "#" + (arr.length - 1) + "#"
            });
            fn = cb(fn);
            arr.forEach(function(_str, i) {
                exec && (_str = _str.replace(/""/g, '\\"'));
                fn = fn.replace("#" + i + "#", '"' + _str + '"')
            });
            return fn
        },
        selectExp: function(val, pos) {
            var valPos = val.slice(0, pos).replace(/"[^"]*"/g, ""),
                m1, m2, remain, exp;
            if (!/"[^"]+$/.test(valPos)) {
                remain = val.slice(pos);
                if ((m1 = valPos.match(/.*?([a-z0-9:$]+)$/i)) && (remain === "" && (m2 = []) || (m2 = remain.match(/^([a-z0-9:$]+)?.*/i)))) {
                    exp = (m1[1] + (m2[1] === null ? "" : m2[1])).replace(/\$/g, "").toUpperCase();
                    return exp
                }
            }
        },
        shiftRC: function(that) {
            var self = cFormulas,
                maxRI = that ? that.get_p_data().length - 1 : 0,
                maxCI = that ? that.colModel.length - 1 : 0;
            return function(fn, diffX, diffY) {
                diffX && (fn = self.shiftC(fn, diffX, maxCI));
                diffY && (fn = self.shiftR(fn, diffY, maxRI));
                return fn
            }
        },
        shiftR: function(fn, diff, maxRI) {
            return cFormulas.deString(fn, function(_fn) {
                _fn = _fn.replace(/(\$?)([A-Z]+)(\$?)([\d]+)/g, function(full, dollar1, letter, dollar2, i) {
                    if (dollar2) {
                        return full
                    } else {
                        var ri = i * 1 + diff - 1;
                        ri = ri < 0 ? 0 : maxRI && ri > maxRI ? maxRI : ri;
                        return dollar1 + letter + (ri + 1)
                    }
                });
                return _fn.replace(/(\$?)([0-9]+):(\$?)([0-9]+)/g, function(full, dollar1, ri1, dollar2, ri2) {
                    var ri;
                    if (!dollar1) {
                        ri = ri1 * 1 + diff - 1;
                        ri = ri < 0 ? 0 : maxRI && ri > maxRI ? maxRI : ri;
                        ri1 = ri + 1
                    }
                    if (!dollar2) {
                        ri = ri2 * 1 + diff - 1;
                        ri = ri < 0 ? 0 : maxRI && ri > maxRI ? maxRI : ri;
                        ri2 = ri + 1
                    }
                    return dollar1 + ri1 + ":" + dollar2 + ri2
                })
            })
        },
        shiftC: function(fn, diff, maxCI) {
            return cFormulas.deString(fn, function(_fn) {
                _fn = _fn.replace(/(\$?)([A-Z]+)(\$?)([\d]+)/g, function(full, dollar1, letter, dollar2, i) {
                    if (dollar1) {
                        return full
                    } else {
                        var ci = pq.toNumber(letter) + diff;
                        ci = ci < 0 ? 0 : maxCI && ci > maxCI ? maxCI : ci;
                        return pq.toLetter(ci) + dollar2 + i
                    }
                });
                return _fn.replace(/(\$?)([A-Z]+):(\$?)([A-Z]+)/g, function(full, dollar1, letter1, dollar2, letter2) {
                    var c;
                    if (!dollar1) {
                        c = pq.toNumber(letter1) + diff;
                        c = c < 0 ? 0 : maxCI && c > maxCI ? maxCI : c;
                        letter1 = pq.toLetter(c)
                    }
                    if (!dollar2) {
                        c = pq.toNumber(letter2) + diff;
                        c = c < 0 ? 0 : maxCI && c > maxCI ? maxCI : c;
                        letter2 = pq.toLetter(c)
                    }
                    return dollar1 + letter1 + ":" + dollar2 + letter2
                })
            })
        }
    });
    cFormulas.prototype = {
        addRowIndx: function(addList) {
            addList.forEach(function(rObj) {
                var rd = rObj.newRow,
                    pq_fn = rd.pq_fn,
                    fn, key;
                if (pq_fn) {
                    for (key in pq_fn) {
                        fn = pq_fn[key];
                        fn.ri = fn.riO = rd.pq_ri
                    }
                }
            })
        },
        cell: function(exp) {
            var cell = this.toCell(exp),
                r = cell.r,
                c = cell.c;
            return this.valueArr(r, c)[0]
        },
        check: function(fn) {
            return cFormulas.deString(fn, function(fn) {
                fn = fn.split(" ").join("");
                return fn.toUpperCase().replace(/([A-Z]+)([0-9]+)\:([A-Z]+)([0-9]+)/g, function(full, c1, r1, c2, r2) {
                    c1 = pq.toNumber(c1);
                    c2 = pq.toNumber(c2);
                    if (c1 > c2) {
                        c1 = [c2, c2 = c1][0]
                    }
                    if (r1 * 1 > r2 * 1) {
                        r1 = [r2, r2 = r1][0]
                    }
                    return pq.toLetter(c1) + r1 + ":" + pq.toLetter(c2) + r2
                })
            })
        },
        computeAll: function() {
            var self = this,
                that = self.that,
                present;
            self.initObj();
            self.eachFormula(function(fnW) {
                fnW.clean = 0;
                present = true
            });
            if (present) {
                self.eachFormula(function(fnW, rd, di, ri, isMain) {
                    rd[di] = self.execIfDirty(fnW);
                    isMain && that.isValid({
                        rowIndx: ri,
                        rowData: rd,
                        dataIndx: di,
                        allowInvalid: true
                    })
                });
                return true
            }
        },
        eachFormula: function(fn) {
            var self = this,
                isMain = true,
                that = self.that,
                cb = function(rd, ri, pq_fn) {
                    var di, fnW;
                    for (di in pq_fn) {
                        fnW = pq_fn[di];
                        if (typeof fnW !== "string") {
                            fn(fnW, rd, di, ri, isMain)
                        }
                    }
                },
                cb2 = function(data) {
                    data = data || [];
                    var i = data.length,
                        rd, pq_fn;
                    while (i--)(rd = data[i]) && (pq_fn = rd.pq_fn) && cb(rd, i, pq_fn)
                };
            cb2(that.get_p_data());
            isMain = false;
            cb2(that.options.summaryData)
        },
        execIfDirty: function(fnW) {
            if (!fnW.clean) {
                fnW.clean = .5;
                fnW.val = this.exec(fnW.fn, fnW.ri, fnW.ci);
                fnW.clean = 1
            } else if (fnW.clean === .5) {
                return
            }
            return fnW.val
        },
        exec: function(_fn, r, c) {
            var self = this,
                obj = self.obj,
                fn = cFormulas.deString(_fn, function(fn) {
                    fn = fn.replace(/(\$?([A-Z]+)?\$?([0-9]+)?\:\$?([A-Z]+)?\$?([0-9]+)?)/g, function(a, b) {
                        obj[b] = obj[b] || self.range(b);
                        return "obj['" + b + "']"
                    });
                    fn = fn.replace(/(?:[^:]|^)(\$?[A-Z]+\$?[0-9]+)(?!:)/g, function(a, b) {
                        obj[b] = obj[b] || self.cell(b);
                        var first = a.charAt(0);
                        return (a === b ? "" : first === "$" ? "" : first) + b
                    });
                    fn = fn.replace(/{/g, "[").replace(/}/g, "]").replace(/(?:[^><])(=+)/g, function(a, b) {
                        return a + (b.length === 1 ? "=" : "")
                    }).replace(/<>/g, "!=").replace(/&/g, "+");
                    return fn
                }, true);
            obj.getRange = function() {
                return {
                    r1: r,
                    c1: c
                }
            };
           
                try {
                    var v = eval(fn);
                    if (typeof v === "function") {
                        v = "#NAME?"
                    } else if (typeof v === "string") {
                        cFormulas.deString(v, function(fn) {
                            if (fn.indexOf("function") >= 0) {
                                v = "#NAME?"
                            }
                        })
                    }
                    v !== v && (v = null)
                } catch (ex) {
                    v = typeof ex === "string" ? ex : ex.message
                }
                return v
            
        },
        initObj: function() {
            this.obj = $.extend({
                iFormula: this
            }, pq.formulas)
        },
        onAutofill: function(ui) {
            var sel = ui.sel,
                self = this,
                that = self.that,
                r = sel.r,
                c = sel.c,
                xDir = ui.x,
                rd = that.getRowData({
                    rowIndx: r
                }),
                CM = that.colModel,
                maxCi = CM.length - 1,
                maxRi = that.get_p_data().length - 1,
                di = CM[c].dataIndx,
                fnW = self.getFnW(rd, di);
            fnW && (ui.series = function(x) {
                return "=" + (xDir ? cFormulas.shiftC(fnW.fn, x - 1, maxCi) : cFormulas.shiftR(fnW.fn, x - 1, maxRi))
            })
        },
        onBeforeValidateDone: function(ui) {
            var self = this,
                colIndxs = this.that.colIndxs,
                fn = function(list) {
                    list.forEach(function(rObj) {
                        var newRow = rObj.newRow,
                            val, di, rd = rObj.rowData,
                            fnW;
                        for (di in newRow) {
                            val = newRow[di];
                            if (typeof val === "string" && val[0] === "=") {
                                ui.allowInvalid = true;
                                var fn = self.check(val),
                                    fnWOld = rd ? self.getFnW(rd, di) : null;
                                if (fnWOld) {
                                    if (fn !== fnWOld.fn) {
                                        rObj.oldRow[di] = "=" + fnWOld.fn;
                                        self.save(rd, di, fn, rObj.rowIndx, colIndxs[di])
                                    }
                                } else {
                                    self.save(rd || newRow, di, fn, rObj.rowIndx, colIndxs[di])
                                }
                            } else if (rd) {
                                if (fnW = self.remove(rd, di)) {
                                    rObj.oldRow[di] = "=" + fnW.fn
                                }
                            }
                        }
                    })
                };
            fn(ui.addList);
            fn(ui.updateList)
        },
        onChange: function(ui) {
            this.addRowIndx(ui.addList);
            if (!ui.addList.length && !ui.deleteList.length) {
                if (this.computeAll()) {
                    ui.source === "edit" && this.that.refresh({
                        header: false
                    })
                }
            }
        },
        onColumnOrder: function() {
            var self = this,
                ciNew, diff, that = self.that,
                shift = cFormulas.shiftRC(that),
                colIndxs = that.colIndxs;
            self.eachFormula(function(fnW, rd, di) {
                ciNew = colIndxs[di];
                if (fnW.ci !== ciNew) {
                    diff = ciNew - fnW.ciO;
                    fnW.ci = ciNew;
                    fnW.fn = shift(fnW.fnOrig, diff, fnW.ri - fnW.riO)
                }
            });
            ciNew !== null && self.computeAll()
        },
        onEditorBegin: function(ui) {
            var fnW = this.getFnW(ui.rowData, ui.dataIndx);
            fnW && ui.$editor.val("=" + fnW.fn)
        },
        onEditorEnd: function() {
            pq.intel.hide()
        },
        onEditorKeyUp: function(evt, ui) {
            var $ed = ui.$editor,
                ed = $ed[0],
                val = ed.value,
                i = pq.intel,
                pos = ed.selectionEnd;
            if (val && val.indexOf("=") === 0) {
                i.popup(val, pos, $ed);
                this.select(val, pos)
            }
        },
        onDataReadyDone: function() {
            var self = this,
                present, that = self.that,
                shift = cFormulas.shiftRC(that),
                colIndxs = that.colIndxs,
                cb = function(rd, riNew, pq_fn) {
                    var fnW, di, diff;
                    for (di in pq_fn) {
                        fnW = pq_fn[di];
                        present = true;
                        if (typeof fnW === "string") {
                            self.save(rd, di, self.check(fnW), riNew, colIndxs[di])
                        } else if (fnW.ri !== riNew) {
                            diff = riNew - fnW.riO;
                            fnW.ri = riNew;
                            fnW.fn = shift(fnW.fnOrig, fnW.ci - fnW.ciO, diff)
                        }
                    }
                },
                cb2 = function(data) {
                    data = data || [];
                    var i = data.length,
                        rd, pq_fn;
                    while (i--)(rd = data[i]) && (pq_fn = rd.pq_fn) && cb(rd, i, pq_fn)
                };
            cb2(that.get_p_data());
            cb2(that.options.summaryData);
            self.initObj();
            present && self.computeAll()
        },
        getFnW: function(rd, di) {
            var fn;
            if (fn = rd.pq_fn) {
                return fn[di]
            }
        },
        remove: function(rd, di) {
            var pq_fn = rd.pq_fn,
                fnW;
            if (pq_fn && (fnW = pq_fn[di])) {
                delete pq_fn[di];
                if (pq.isEmpty(pq_fn)) {
                    delete rd.pq_fn
                }
                return fnW
            }
        },
        range: function(exp) {
            var arr = exp.split(":"),
                that = this.that,
                cell1 = this.toCell(arr[0]),
                r1 = cell1.r,
                c1 = cell1.c,
                cell2 = this.toCell(arr[1]),
                r2 = cell2.r,
                c2 = cell2.c;
            return this.valueArr(r1 === null ? 0 : r1, c1 === null ? 0 : c1, r2 === null ? that.get_p_data().length - 1 : r2, c2 === null ? that.colModel.length - 1 : c2)
        },
        save: function(rd, di, fn, ri, ci) {
            var fns, fn_checked = fn.replace(/^=/, ""),
                fnW = {
                    clean: 0,
                    fn: fn_checked,
                    fnOrig: fn_checked,
                    riO: ri,
                    ciO: ci,
                    ri: ri,
                    ci: ci
                };
            fns = rd.pq_fn = rd.pq_fn || {};
            fns[di] = fnW;
            return fnW
        },
        selectRange: function(val, pos) {
            var exp = cFormulas.selectExp(val, pos),
                arr, m1, m2, range;
            if (exp) {
                if (/^([a-z0-9]+):([a-z0-9]+)$/i.test(exp)) {
                    arr = exp.split(":");
                    m1 = this.toCell(arr[0]);
                    m2 = this.toCell(arr[1]);
                    range = {
                        r1: m1.r,
                        c1: m1.c,
                        r2: m2.r,
                        c2: m2.c
                    }
                } else if (/^[a-z]+[0-9]+$/i.test(exp)) {
                    m1 = this.toCell(exp);
                    range = {
                        r1: m1.r,
                        c1: m1.c
                    }
                }
                return range
            }
        },
        select: function(val, pos) {
            var range = this.selectRange(val, pos),
                that = this.that;
            range ? that.Range(range).select() : that.Selection().removeAll()
        },
        toCell: function(address) {
            var m = address.match(/\$?([A-Z]+)?\$?(\d+)?/);
            return {
                c: m[1] ? pq.toNumber(m[1]) : null,
                r: m[2] ? m[2] - 1 : null
            }
        },
        valueArr: function(r1, c1, r2, c2) {
            var that = this.that,
                CM = that.colModel,
                clen = CM.length,
                ri, ci, rd, di, fnW, val, arr = [],
                arr2 = [],
                _arr2 = [],
                data = that.get_p_data(),
                dlen = data.length;
            r2 = r2 === null ? r1 : r2;
            c2 = c2 === null ? c1 : c2;
            r1 = r1 < 0 ? 0 : r1;
            c1 = c1 < 0 ? 0 : c1;
            r2 = r2 >= dlen ? dlen - 1 : r2;
            c2 = c2 >= clen ? clen - 1 : c2;
            for (ri = r1; ri <= r2; ri++) {
                rd = data[ri];
                for (ci = c1; ci <= c2; ci++) {
                    di = CM[ci].dataIndx;
                    if (fnW = this.getFnW(rd, di)) {
                        val = this.execIfDirty(fnW)
                    } else {
                        val = rd[di]
                    }
                    arr.push(val);
                    _arr2.push(val)
                }
                arr2.push(_arr2);
                _arr2 = []
            }
            arr.get2Arr = function() {
                return arr2
            };
            arr.getRange = function() {
                return {
                    r1: r1,
                    c1: c1,
                    r2: r2,
                    c2: c2
                }
            };
            return arr
        }
    }
})(jQuery);
(function($) {
    var pq = window.pq = window.pq || {};
    pq.intel = {
        removeFn: function(text) {
            var len = text.length,
                len2;
            text = text.replace(/[a-z]*\([^()]*\)/gi, "");
            len2 = text.length;
            return len === len2 ? text : this.removeFn(text)
        },
        removeStrings: function(text) {
            text = text.replace(/"[^"]*"/g, "");
            return text.replace(/"[^"]*$/, "")
        },
        getMatch: function(text, exact) {
            var obj = pq.formulas,
                arr = [],
                fn;
            text = text.toUpperCase();
            for (fn in obj) {
                if (exact) {
                    if (fn === text) {
                        return [fn]
                    }
                } else if (fn.indexOf(text) === 0) {
                    arr.push(fn)
                }
            }
            return arr
        },
        intel: function(text) {
            text = this.removeStrings(text);
            text = this.removeFn(text);
            var re = /^=(.*[,+\-&*\s(><=])?([a-z]+)((\()[^)]*)?$/i,
                m, fn, exact;
            if (m = text.match(re)) {
                fn = m[2];
                m[4] && (exact = true)
            }
            return [fn, exact]
        },
        movepos: function(val) {
            var m;
            if (m = val.match(/([^a-z].*)/i)) {
                return val.indexOf(m[1]) + 1
            }
            return val.length
        },
        intel3: function(val, pos) {
            if (pos < val.length && /=(.*[,+\-&*\s(><=])?[a-z]+$/i.test(val.slice(0, pos))) {
                pos += this.movepos(val.slice(pos))
            }
            var valPos = val.substr(0, pos),
                fn = this.intel(valPos);
            return fn
        },
        item: function(fn) {
            var desc = this.that.options.strFormulas;
            desc = desc ? desc[fn] : null;
            return "<div>" + (desc ? desc[0] : fn) + "</div>" + (desc ? "<div style='font-size:0.9em;color:#888;margin-bottom:5px;'>" + desc[1] + "</div>" : "")
        },
        popup: function(val, pos, $editor) {
            var $grid = $editor.closest(".pq-grid"),
                $old_intel = $(".pq-intel"),
                $parent = $grid,
                fn, fns, content, arr = this.intel3(val, pos);
            this.that = $grid.pqGrid("instance");
            $old_intel.remove();
            if (fn = arr[0]) {
                fns = this.getMatch(fn, arr[1]);
                content = fns.map(this.item, this).join("");
                if (content) {
                    $("<div class='pq-intel' style='width:350px;max-height:300px;overflow:auto;background:#fff;border:1px solid gray;box-shadow: 4px 4px 2px #aaaaaa;padding:5px;'></div>").appendTo($parent).html(content).position({
                        my: "center top",
                        at: "center bottom",
                        collision: "flipfit",
                        of: $editor,
                        within: $parent
                    })
                }
            }
        },
        hide: function() {
            $(".pq-intel").remove()
        }
    }
})(jQuery);
(function($) {
    var f = pq.formulas = {
        evalify: function(arr, cond) {
            var m = cond.match(/([><=]{1,2})?(.*)/),
                m1 = m[1] || "=",
                m2 = m[2],
                reg, isNumber, self = this;
            if (/(\*|\?)/.test(m2)) {
                reg = m2.replace(/\*/g, ".*").replace(/\?/g, "\\S").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
            } else {
                m1 = m1 === "=" ? "==" : m1 === "<>" ? "!=" : m1;
                isNumber = this.isNumber(m2)
            }
            return arr.map(function(val) {
                if (reg) {
                    val = val === null ? "" : val;
                    val = (m1 === "<>" ? "!" : "") + "/^" + reg + '$/i.test("' + val + '")'
                } else if (isNumber) {
                    if (self.isNumber(val)) {
                        val = val + m1 + m2
                    } else {
                        val = "false"
                    }
                } else {
                    val = val === null ? "" : val;
                    val = '"' + (val + "").toUpperCase() + '"' + m1 + '"' + (m2 + "").toUpperCase() + '"'
                }
                return val
            })
        },
        get2Arr: function(arr) {
            return arr.get2Arr ? arr.get2Arr() : arr
        },
        isNumber: function(val) {
            return parseFloat(val) === val
        },
        _reduce: function(arr, arr2) {
            var len = arr.length,
                _arr = [],
                _arr2 = arr2.map(function(a) {
                    return []
                });
            arr.forEach(function(val, indx) {
                if (val !== null) {
                    val = val * 1;
                    if (!isNaN(val)) {
                        _arr.push(val);
                        _arr2.forEach(function(_a, i) {
                            _a.push(arr2[i][indx])
                        })
                    }
                }
            });
            return [_arr, _arr2]
        },
        reduce: function(arg) {
            arg = this.toArray(arg);
            var arr = arg.shift(),
                arr2 = arg.filter(function(_arr, indx) {
                    return indx % 2 === 0
                }),
                a = this._reduce(arr, arr2);
            arr = a[0];
            arr2 = a[1];
            return [arr].concat(arg.map(function(item, indx) {
                return indx % 2 === 0 ? arr2[indx / 2] : arg[indx]
            }))
        },
        strDate1: "(\\d{1,2})/(\\d{1,2})/(\\d{2,4})",
        strDate2: "(\\d{4})-(\\d{1,2})-(\\d{1,2})",
        strTime: "(\\d{1,2})(:(\\d{1,2}))?(:(\\d{1,2}))?(\\s(AM|PM))?",
        isDate: function(val) {
            return this.reDate.test(val) && Date.parse(val) || val && val.constructor === Date
        },
        toArray: function(arg) {
            var arr = [],
                i = 0,
                len = arg.length;
            for (; i < len; i++) {
                arr.push(arg[i])
            }
            return arr
        },
        valueToDate: function(val) {
            var dt = new Date(Date.UTC(1900, 0, 1));
            dt.setUTCDate(dt.getUTCDate() + val - 2);
            return dt
        },
        varToDate: function(val) {
            var val2, mt, m, d, y;
            if (this.isNumber(val)) {
                val2 = this.valueToDate(val)
            } else if (val.getTime) {
                val2 = val
            } else if (typeof val === "string") {
                if (mt = val.match(this.reDateTime)) {
                    if (mt[12]) {
                        y = mt[13] * 1;
                        d = mt[15] * 1;
                        m = mt[14] * 1
                    } else {
                        m = mt[2] * 1;
                        d = mt[3] * 1;
                        y = mt[4] * 1
                    }
                } else if (mt = val.match(this.reDate2)) {
                    y = mt[1] * 1;
                    d = mt[3] * 1;
                    m = mt[2] * 1
                } else if (mt = val.match(this.reDate1)) {
                    m = mt[1] * 1;
                    d = mt[2] * 1;
                    y = mt[3] * 1
                }
                if (mt) {
                    val = Date.UTC(y, m - 1, d)
                } else {
                    throw "#N/A date"
                }
                val2 = new Date(val)
            }
            return val2
        },
        _IFS: function(arg, fn) {
            var len = arg.length,
                i = 0,
                arr = [],
                a = 0;
            for (; i < len; i = i + 2) {
                arr.push(this.evalify(arg[i], arg[i + 1]))
            }
            var condsIndx = arr[0].length,
                lenArr = len / 2,
                j;
            while (condsIndx--) {
                for (j = 0; j < lenArr; j++) {
                    if (!eval(arr[j][condsIndx])) {
                        break
                    }
                }
                a += j === lenArr ? fn(condsIndx) : 0
            }
            return a
        },
        ABS: function(val) {
            return Math.abs(val.map ? val[0] : val)
        },
        ACOS: function(val) {
            return Math.acos(val)
        },
        AND: function() {
            var arr = this.toArray(arguments);
            return eval(arr.join(" && "))
        },
        ASIN: function(val) {
            return Math.asin(val)
        },
        ATAN: function(val) {
            return Math.atan(val)
        },
        _AVERAGE: function(arr) {
            var count = 0,
                sum = 0;
            arr.forEach(function(val) {
                if (parseFloat(val) === val) {
                    sum += val * 1;
                    count++
                }
            });
            if (count) {
                return sum / count
            }
            throw "#DIV/0!"
        },
        AVERAGE: function() {
            return this._AVERAGE(pq.flatten(arguments))
        },
        AVERAGEIF: function(range, cond, avg_range) {
            return this.AVERAGEIFS(avg_range || range, range, cond)
        },
        AVERAGEIFS: function() {
            var args = this.reduce(arguments),
                count = 0,
                avg_range = args.shift(),
                sum = this._IFS(args, function(condIndx) {
                    count++;
                    return avg_range[condIndx]
                });
            if (!count) {
                throw "#DIV/0!"
            }
            return sum / count
        },
        TRUE: true,
        FALSE: false,
        CEILING: function(val) {
            return Math.ceil(val)
        },
        CHAR: function(val) {
            return String.fromCharCode(val)
        },
        CHOOSE: function() {
            var arr = pq.flatten(arguments),
                num = arr[0];
            if (num > 0 && num < arr.length) {
                return arr[num]
            } else {
                throw "#VALUE!"
            }
        },
        CODE: function(val) {
            return (val + "").charCodeAt(0)
        },
        COLUMN: function(val) {
            return (val || this).getRange().c1 + 1
        },
        COLUMNS: function(arr) {
            var r = arr.getRange();
            return r.c2 - r.c1 + 1
        },
        CONCATENATE: function() {
            var arr = pq.flatten(arguments),
                str = "";
            arr.forEach(function(val) {
                str += val
            });
            return str
        },
        COS: function(val) {
            return Math.cos(val)
        },
        _COUNT: function(arg) {
            var arr = pq.flatten(arg),
                self = this,
                empty = 0,
                values = 0,
                numbers = 0;
            arr.forEach(function(val) {
                if (val === null || val === "") {
                    empty++
                } else {
                    values++;
                    if (self.isNumber(val)) {
                        numbers++
                    }
                }
            });
            return [empty, values, numbers]
        },
        COUNT: function() {
            return this._COUNT(arguments)[2]
        },
        COUNTA: function() {
            return this._COUNT(arguments)[1]
        },
        COUNTBLANK: function() {
            return this._COUNT(arguments)[0]
        },
        COUNTIF: function(range, cond) {
            return this.COUNTIFS(range, cond)
        },
        COUNTIFS: function() {
            return this._IFS(arguments, function() {
                return 1
            })
        },
        DATE: function(year, month, date) {
            if (year < 0 || year > 9999) {
                throw "#NUM!"
            } else if (year <= 1899) {
                year += 1900
            }
            return this.VALUE(new Date(Date.UTC(year, month - 1, date)))
        },
        DATEVALUE: function(val) {
            return this.DATEDIF("1/1/1900", val, "D") + 2
        },
        DATEDIF: function(start, end, unit) {
            var to = this.varToDate(end),
                from = this.varToDate(start),
                months, endTime = to.getTime(),
                startTime = from.getTime(),
                diffDays = (endTime - startTime) / (1e3 * 60 * 60 * 24);
            if (unit === "Y") {
                return parseInt(diffDays / 365)
            } else if (unit === "M") {
                months = to.getUTCMonth() - from.getUTCMonth() + 12 * (to.getUTCFullYear() - from.getUTCFullYear());
                if (from.getUTCDate() > to.getUTCDate()) {
                    months--
                }
                return months
            } else if (unit === "D") {
                return diffDays
            } else {
                throw "unit N/A"
            }
        },
        DAY: function(val) {
            return this.varToDate(val).getUTCDate()
        },
        DAYS: function(end, start) {
            return this.DATEDIF(start, end, "D")
        },
        DEGREES: function(val) {
            return 180 / Math.PI * val
        },
        EOMONTH: function(val, i) {
            i = i || 0;
            var dt = this.varToDate(val);
            dt.setUTCMonth(dt.getUTCMonth() + i + 1);
            dt.setUTCDate(0);
            return this.VALUE(dt)
        },
        EXP: function(val) {
            return Math.exp(val)
        },
        FIND: function(val, str, start) {
            return str.indexOf(val, start ? start - 1 : 0) + 1
        },
        FLOOR: function(val, num) {
            if (val * num < 0) {
                return "#NUM!"
            }
            return parseInt(val / num) * num
        },
        HLOOKUP: function(val, arr, row, approx) {
            approx === null && (approx = true);
            arr = this.get2Arr(arr);
            var col = this.MATCH(val, arr[0], approx ? 1 : 0);
            return this.INDEX(arr, row, col)
        },
        HOUR: function(val) {
            if (Date.parse(val)) {
                var d = new Date(val);
                return d.getHours()
            } else {
                return val * 24
            }
        },
        IF: function(cond, truthy, falsy) {
            return cond ? truthy : falsy
        },
        INDEX: function(arr, row, col) {
            arr = this.get2Arr(arr);
            row = row || 1;
            col = col || 1;
            if (typeof arr[0].push === "function") {
                return arr[row - 1][col - 1]
            } else {
                return arr[row > 1 ? row - 1 : col - 1]
            }
        },
        INDIRECT: function(ref) {
            var iF = this.iFormula;
            return iF.cell(ref.toUpperCase())
        },
        LARGE: function(arr, n) {
            arr.sort();
            return arr[arr.length - (n || 1)]
        },
        LEFT: function(val, x) {
            return val.substr(0, x || 1)
        },
        LEN: function(val) {
            val = (val.map ? val : [val]).map(function(val) {
                return val.length
            });
            return val.length > 1 ? val : val[0]
        },
        LOOKUP: function(val, arr1, arr2) {
            arr2 = arr2 || arr1;
            var col = this.MATCH(val, arr1, 1);
            return this.INDEX(arr2, 1, col)
        },
        LOWER: function(val) {
            return (val + "").toLocaleLowerCase()
        },
        _MAXMIN: function(arr, factor) {
            var max, self = this;
            arr.forEach(function(val) {
                if (val !== null) {
                    val = self.VALUE(val);
                    if (self.isNumber(val) && (val * factor > max * factor || max === null)) {
                        max = val
                    }
                }
            });
            return max !== null ? max : 0
        },
        MATCH: function(val, arr, type) {
            var isNumber = this.isNumber(val),
                _isNumber, sign, indx, _val, i = 0,
                len = arr.length;
            type === null && (type = 1);
            val = isNumber ? val : val.toUpperCase();
            if (type === 0) {
                arr = this.evalify(arr, val + "");
                for (i = 0; i < len; i++) {
                    _val = arr[i];
                    if (eval(_val)) {
                        indx = i + 1;
                        break
                    }
                }
            } else {
                for (i = 0; i < len; i++) {
                    _val = arr[i];
                    _isNumber = this.isNumber(_val);
                    _val = arr[i] = _isNumber ? _val : _val ? _val.toUpperCase() : "";
                    if (val === _val) {
                        indx = i + 1;
                        break
                    }
                }
                if (!indx) {
                    for (i = 0; i < len; i++) {
                        _val = arr[i];
                        _isNumber = this.isNumber(_val);
                        if (type * (_val < val ? -1 : 1) === 1 && isNumber === _isNumber) {
                            indx = i;
                            break
                        }
                    }
                    indx = indx === null ? i : indx
                }
            }
            if (indx) {
                return indx
            }
            throw "#N/A"
        },
        MAX: function() {
            var arr = pq.flatten(arguments);
            return this._MAXMIN(arr, 1)
        },
        MEDIAN: function() {
            var arr = pq.flatten(arguments).filter(function(val) {
                    return val * 1 === val
                }).sort(function(a, b) {
                    return b - a
                }),
                len = arr.length,
                len2 = len / 2;
            return len2 === parseInt(len2) ? (arr[len2 - 1] + arr[len2]) / 2 : arr[(len - 1) / 2]
        },
        MID: function(val, x, num) {
            if (x < 1 || num < 0) {
                throw "#VALUE!"
            }
            return val.substr(x - 1, num)
        },
        MIN: function() {
            var arr = pq.flatten(arguments);
            return this._MAXMIN(arr, -1)
        },
        MODE: function() {
            var arr = pq.flatten(arguments),
                obj = {},
                freq, rval, rfreq = 0;
            arr.forEach(function(val) {
                freq = obj[val] = obj[val] ? obj[val] + 1 : 1;
                if (rfreq < freq) {
                    rfreq = freq;
                    rval = val
                }
            });
            if (rfreq < 2) {
                throw "#N/A"
            }
            return rval
        },
        MONTH: function(val) {
            return this.varToDate(val).getUTCMonth() + 1
        },
        OR: function() {
            var arr = this.toArray(arguments);
            return eval(arr.join(" || "))
        },
        PI: function() {
            return Math.PI
        },
        POWER: function(num, pow) {
            return Math.pow(num, pow)
        },
        PRODUCT: function() {
            var arr = pq.flatten(arguments),
                a = 1;
            arr.forEach(function(val) {
                a *= val
            });
            return a
        },
        PROPER: function(val) {
            val = val.replace(/(\S+)/g, function(val) {
                return val.charAt(0).toUpperCase() + val.substr(1).toLowerCase()
            });
            return val
        },
        RADIANS: function(val) {
            return Math.PI / 180 * val
        },
        RAND: function() {
            return Math.random()
        },
        RANK: function(val, arr, order) {
            var r = JSON.stringify(arr.getRange()),
                self = this,
                key = r + "_range";
            arr = this[key] || function() {
                self[key] = arr;
                return arr.sort(function(a, b) {
                    return a - b
                })
            }();
            var i = 0,
                len = arr.length;
            for (; i < len; i++) {
                if (val === arr[i]) {
                    return order ? i + 1 : len - i
                }
            }
        },
        RATE: function() {},
        REPLACE: function(val, start, num, _char) {
            val += "";
            return val.substr(0, start - 1) + _char + val.substr(start + num - 1)
        },
        REPT: function(val, num) {
            var str = "";
            while (num--) {
                str += val
            }
            return str
        },
        RIGHT: function(val, x) {
            x = x || 1;
            return val.substr(-1 * x, x)
        },
        _ROUND: function(val, digits, fn) {
            var multi = Math.pow(10, digits),
                val2 = val * multi,
                _int = parseInt(val2),
                frac = val2 - _int;
            return fn(_int, frac) / multi
        },
        ROUND: function(val, digits) {
            return this._ROUND(val, digits, function(_int, frac) {
                var absFrac = Math.abs(frac);
                return _int + (absFrac >= .5 ? absFrac / frac : 0)
            })
        },
        ROUNDDOWN: function(val, digits) {
            return this._ROUND(val, digits, function(_int) {
                return _int
            })
        },
        ROUNDUP: function(val, digits) {
            return this._ROUND(val, digits, function(_int, frac) {
                return _int + (frac ? Math.abs(frac) / frac : 0)
            })
        },
        ROW: function(val) {
            return (val || this).getRange().r1 + 1
        },
        ROWS: function(arr) {
            var r = arr.getRange();
            return r.r2 - r.r1 + 1
        },
        SEARCH: function(val, str, start) {
            val = val.toUpperCase();
            str = str.toUpperCase();
            return str.indexOf(val, start ? start - 1 : 0) + 1
        },
        SIN: function(val) {
            return Math.sin(val)
        },
        SMALL: function(arr, n) {
            arr.sort();
            return arr[(n || 1) - 1]
        },
        SQRT: function(val) {
            return Math.sqrt(val)
        },
        _STDEV: function(arr) {
            arr = pq.flatten(arr);
            var len = arr.length,
                avg = this._AVERAGE(arr),
                sum = 0;
            arr.forEach(function(x) {
                sum += (x - avg) * (x - avg)
            });
            return [sum, len]
        },
        STDEV: function() {
            var arr = this._STDEV(arguments);
            if (arr[1] === 1) {
                throw "#DIV/0!"
            }
            return Math.sqrt(arr[0] / (arr[1] - 1))
        },
        STDEVP: function() {
            var arr = this._STDEV(arguments);
            return Math.sqrt(arr[0] / arr[1])
        },
        SUBSTITUTE: function(text, old, new_text, indx) {
            var a = 0;
            return text.replace(new RegExp(old, "g"), function(m) {
                a++;
                return indx ? a === indx ? new_text : old : new_text
            })
        },
        SUM: function() {
            var arr = pq.flatten(arguments),
                sum = 0,
                self = this;
            arr.forEach(function(val) {
                val = self.VALUE(val);
                if (self.isNumber(val)) {
                    sum += parseFloat(val)
                }
            });
            return sum
        },
        SUMIF: function(range, cond, sum_range) {
            return this.SUMIFS(sum_range || range, range, cond)
        },
        SUMIFS: function() {
            var args = this.reduce(arguments),
                sum_range = args.shift();
            return this._IFS(args, function(condIndx) {
                return sum_range[condIndx]
            })
        },
        SUMPRODUCT: function() {
            var arr = this.toArray(arguments);
            arr = arr[0].map(function(val, i) {
                var prod = 1;
                arr.forEach(function(_arr) {
                    var val = _arr[i];
                    prod *= parseFloat(val) === val ? val : 0
                });
                return prod
            });
            return pq.aggregate.sum(arr)
        },
        TAN: function(val) {
            return Math.tan(val)
        },
        TEXT: function(val, format) {
            if (this.isNumber(val) && format.indexOf("#") >= 0) {
                return pq.formatNumber(val, format)
            } else {
                return $.datepicker.formatDate(pq.excelToJui(format), this.varToDate(val))
            }
        },
        TIME: function(h, m, s) {
            return (h + m / 60 + s / 3600) / 24
        },
        TIMEVALUE: function(val) {
            var m = val.match(this.reTime);
            if (m && m[1] !== null && (m[3] !== null || m[7] !== null)) {
                var mH = m[1] * 1,
                    mM = (m[3] || 0) * 1,
                    mS = (m[5] || 0) * 1,
                    am = (m[7] || "").toUpperCase(),
                    v = mH + mM / 60 + mS / 3600
            }
            if (0 <= v && (am && v < 13 || !am && v < 24)) {
                if (am === "PM" && mH < 12) {
                    v += 12
                } else if (am === "AM" && mH === 12) {
                    v -= 12
                }
                return v / 24
            }
            throw "#VALUE!"
        },
        TODAY: function() {
            var d = new Date;
            return this.VALUE(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))
        },
        TRIM: function(val) {
            return val.replace(/^\s+|\s+$/gm, "")
        },
        TRUNC: function(val, num) {
            num = Math.pow(10, num || 0);
            return ~~(val * num) / num
        },
        UPPER: function(val) {
            return (val + "").toLocaleUpperCase()
        },
        VALUE: function(val) {
            var m, val2;
            if (!val) {
                val2 = 0
            } else if (parseFloat(val) === val) {
                val2 = parseFloat(val)
            } else if (this.isDate(val)) {
                val2 = this.DATEVALUE(val)
            } else if (m = val.match(this.reDateTime)) {
                var dt = m[1] || m[12],
                    t = val.substr(dt.length + 1);
                val2 = this.DATEVALUE(dt) + this.TIMEVALUE(t)
            } else if (m = val.match(this.reTime)) {
                val2 = this.TIMEVALUE(val)
            } else {
                val2 = val.replace(/[^0-9\-.]/g, "");
                val2 = val2.replace(/(\.[1-9]*)0+$/, "$1").replace(/\.$/, "")
            }
            return val2
        },
        VAR: function() {
            var arr = this._STDEV(arguments);
            return arr[0] / (arr[1] - 1)
        },
        VARP: function() {
            var arr = this._STDEV(arguments);
            return arr[0] / arr[1]
        },
        VLOOKUP: function(val, arr, col, approx) {
            approx === null && (approx = true);
            arr = this.get2Arr(arr);
            var arrCol = arr.map(function(arr) {
                    return arr[0]
                }),
                row = this.MATCH(val, arrCol, approx ? 1 : 0);
            return this.INDEX(arr, row, col)
        },
        YEAR: function(val) {
            return this.varToDate(val).getUTCFullYear()
        }
    };
    f.reDate1 = new RegExp("^" + f.strDate1 + "$");
    f.reDate2 = new RegExp("^" + f.strDate2 + "$");
    f.reDate = new RegExp("^" + f.strDate1 + "$|^" + f.strDate2 + "$");
    f.reTime = new RegExp("^" + f.strTime + "$", "i");
    f.reDateTime = new RegExp("^(" + f.strDate1 + ")\\s" + f.strTime + "$|^(" + f.strDate2 + ")\\s" + f.strTime + "$")
})(jQuery);
(function($) {
    pq.Select = function(options, $ele) {
        if (this instanceof pq.Select === false) {
            return new pq.Select(options, $ele)
        }
        var $parentGrid = $ele.closest(".pq-grid"),
            $div = $("<div/>").appendTo($parentGrid),
            grid = pq.grid($div, $.extend({
                width: $ele[0].offsetWidth,
                scrollModel: {
                    autoFit: true
                },
                height: "flex",
                autoRow: false,
                numberCell: {
                    show: false
                },
                hoverMode: "row",
                fillHandle: "",
                stripeRows: false,
                showTop: false,
                showHeader: false
            }, options));
        pq.makePopup($div[0]);
        $div.position({
            my: "left top",
            at: "left bottom",
            of: $ele,
            collision: "flipfit",
            within: $parentGrid
        })
    }
})(jQuery);
(function($) {
    var cPrimary = function(that) {
        this.options = that.options
    };
    cPrimary.prototype = {
        empty: function() {
            for (var key in this) {
                if (key.indexOf("_") === 0) {
                    delete this[key]
                }
            }
            delete this.options.dataModel.dataPrimary
        },
        getCM: function() {
            return this._cm
        },
        setCM: function(_cm) {
            this._cm = _cm
        },
        getCols: function() {
            return this._columns
        },
        setCols: function(val) {
            this._columns = val
        },
        getDMData: function() {
            return this.options.dataModel.dataPrimary
        },
        setDMData: function(val) {
            this.options.dataModel.dataPrimary = val
        },
        getOCM: function() {
            return this._ocm
        },
        setOCM: function(v) {
            this._ocm = v
        }
    };
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance,
            p = grid.Group();
        p.primary = new cPrimary(grid);
        grid.on("beforeFilterDone", p.onBeforeFilterDone.bind(p)).one("CMInit", p.oneCMInit.bind(p))
    });
    var old = {},
        _p = {
            clearPivot: function(wholeData) {
                if (this.isPivot()) {
                    var that = this.that,
                        DM = that.options.dataModel,
                        primary = this.primary;
                    primary.getOCM() && that.refreshCM(primary.getOCM());
                    if (wholeData) {
                        if (!primary.getDMData()) {
                            throw "!primary.getDMData"
                        }
                        DM.data = primary.getDMData()
                    } else if (primary.getDMData()) {
                        DM.data = primary.getDMData()
                    }
                    this.primary.empty();
                    this.setPivot(false);
                    return true
                }
            },
            getColsPrimary: function() {
                return this.primary.getCols() || this.that.columns
            },
            getCMPrimary: function() {
                return this.primary.getCM() || this.that.colModel
            },
            getOCMPrimary: function() {
                return this.primary.getOCM() || this.that.options.colModel
            },
            getSumCols: function() {
                return (old.getSumCols.call(this) || []).map(function(col) {
                    return [col.dataIndx, col.dataType, col.summary, col.summary.type + "(" + col.title + ")", col.width, col.format, col.showifOpen]
                })
            },
            getVal: function() {
                return this._pivot ? function(rd, di) {
                    return rd[di]
                } : old.getVal.apply(this, arguments)
            },
            groupData: function() {
                var self = this,
                    that = self.that,
                    o = that.options,
                    GM = o.groupModel,
                    GMdataIndx = GM.dataIndx,
                    old_GMdataIndx, oldTitleInFirstCol, oldMerge, groupCols = GM.groupCols,
                    isPivot = self.isPivot(),
                    pivotTurnOn = !isPivot && GM.pivot,
                    groupColsLen = groupCols.length;
                if (pivotTurnOn) {
                    if (groupColsLen) {
                        old_GMdataIndx = GMdataIndx.slice();
                        GM.dataIndx = GMdataIndx = GMdataIndx.concat(groupCols)
                    }
                    self.skipConcat = true;
                    oldTitleInFirstCol = GM.titleInFirstCol;
                    oldMerge = GM.merge;
                    GM.titleInFirstCol = false;
                    GM.fixCols = true;
                    GM.merge = false
                } else if (isPivot && groupColsLen) {
                    old_GMdataIndx = GMdataIndx.slice();
                    GM.dataIndx.length = GM.dataIndx.length - 1;
                    self.setPivot(false)
                }
                old.groupData.call(self);
                if (pivotTurnOn) that.pdata = that.pdata.reduce(function(arr, rd) {
                    if (rd.pq_gtitle) {
                        arr.push(rd)
                    }
                    return arr
                }, []);
                if (isPivot && groupColsLen) {
                    GM.dataIndx = old_GMdataIndx;
                    self.setPivot(true)
                }
                if (pivotTurnOn) {
                    if (groupColsLen) {
                        if (oldTitleInFirstCol) {
                            GM.titleInFirstCol = true;
                            GM.fixCols = false
                        } else if (old_GMdataIndx.length > 1) {
                            GM.merge = oldMerge
                        }
                        self.pivotData(GMdataIndx, old_GMdataIndx);
                        GM.dataIndx = old_GMdataIndx.slice(0, old_GMdataIndx.length - 1);
                        GM.summaryInTitleRow = "all";
                        self.skipConcat = false;
                        var di1 = self.firstCol().dataIndx,
                            di2 = old_GMdataIndx[old_GMdataIndx.length - 1];
                        if (oldTitleInFirstCol && di1 !== di2) that.pdata.forEach(function(rd) {
                            rd[di1] = rd[di2]
                        });
                        old.groupData.call(self);
                        GM.dataIndx = old_GMdataIndx;
                        self.setPivot(true)
                    }
                    self.skipConcat = false
                }
                that._trigger("groupData")
            },
            isPivot: function() {
                return this._pivot
            },
            getSorter: function(column) {
                var pivotColSortFn = column.pivotSortFn,
                    dt;
                if (!pivotColSortFn) {
                    dt = pq.getDataType(column);
                    pivotColSortFn = dt === "number" ? function(a, b) {
                        return a.sortby * 1 > b.sortby * 1 ? 1 : -1
                    } : function(a, b) {
                        return a.sortby > b.sortby ? 1 : -1
                    }
                }
                return pivotColSortFn
            },
            nestedCM: function(sumCols, GM) {
                var self = this,
                    groupCols = GM.groupCols,
                    pivotColsTotal = GM.pivotColsTotal,
                    showifOpenForAggr = pivotColsTotal === "hideifOpen" ? false : null,
                    sorters = [],
                    dts = [],
                    columns = self.that.columns;
                columns = groupCols.map(function(di) {
                    var col = columns[di];
                    sorters.push(self.getSorter(col));
                    dts.push(pq.getDataType(col));
                    return col
                });
                return function nestedCM(objCM, level, labelArr) {
                    level = level || 0;
                    labelArr = labelArr || [];
                    var i = 0,
                        column, arr, col, dt, title, colModel, aggr, aggrCM, CM = [];
                    if ($.isEmptyObject(objCM)) {
                        for (; i < sumCols.length; i++) {
                            column = sumCols[i];
                            arr = labelArr.slice();
                            arr.push(column[0]);
                            col = {
                                dataIndx: arr.join("_"),
                                dataType: column[1],
                                summary: column[2],
                                title: column[3],
                                width: column[4],
                                format: column[5],
                                showifOpen: column[6]
                            };
                            CM.push(col)
                        }
                    } else {
                        column = columns[level];
                        dt = dts[level];
                        for (title in objCM) {
                            aggr = title === "aggr";
                            arr = labelArr.slice();
                            arr.push(title);
                            colModel = nestedCM(objCM[title], level + 1, arr);
                            if (aggr) {
                                aggrCM = colModel;
                                aggrCM.forEach(function(col) {
                                    col.showifOpen = showifOpenForAggr;
                                    col.type = "aggr"
                                })
                            } else {
                                col = {
                                    showifOpen: true,
                                    sortby: title,
                                    title: pq.format(column, title, dt),
                                    colModel: colModel
                                };
                                if (colModel.length > 1 && !colModel.find(function(col) {
                                        return !col.type
                                    }).dataIndx) {
                                    col.collapsible = {
                                        on: true,
                                        last: null
                                    }
                                }
                                CM.push(col)
                            }
                        }
                        CM.sort(sorters[level]);
                        if (aggrCM) CM[pivotColsTotal === "before" ? "unshift" : "push"].apply(CM, aggrCM)
                    }
                    return CM
                }
            },
            onBeforeFilterDone: function(evt, ui) {
                if (this.isPivot()) {
                    var rules = ui.rules,
                        cols = this.primary.getCols(),
                        i = 0,
                        rule;
                    for (; i < rules.length; i++) {
                        rule = rules[i];
                        if (!cols[rule.dataIndx]) {
                            return false
                        }
                    }
                    this.clearPivot(true);
                    ui.header = true
                }
            },
            oneCMInit: function() {
                this.updateAgg(this.that.options.groupModel.agg)
            },
            option: function(ui, refresh, source, fn) {
                var self = this,
                    valObj = ui.agg;
                if (self.isPivot()) {
                    self.clearPivot()
                }
                if (valObj) {
                    self.updateAgg(valObj, self.that.options.groupModel.agg)
                }
                old.option.call(self, ui, refresh, source, fn)
            },
            pivotData: function(GPMdataIndx, GMdataIndx) {
                var that = this.that,
                    sumCols = this.getSumCols(),
                    sumDIs = this.getSumDIs(),
                    o = that.options,
                    GM = o.groupModel,
                    primary = this.primary,
                    data = that.pdata,
                    columns = that.columns,
                    col0, CM;
                if (GM.titleInFirstCol) {
                    col0 = that.colModel[0];
                    CM = [col0].concat(GMdataIndx.reduce(function(_CM, di) {
                        if (di !== col0.dataIndx) {
                            _CM.push($.extend({
                                hidden: true
                            }, columns[di]))
                        }
                        return _CM
                    }, []))
                } else {
                    CM = GMdataIndx.map(function(di) {
                        return columns[di]
                    })
                }
                var objCM = this.transformData(data, sumDIs, GPMdataIndx, GMdataIndx),
                    CM2 = this.nestedCM(sumCols, GM)(objCM),
                    ui = {};
                ui.CM = CM = CM.concat(CM2);
                that._trigger("pivotCM", null, ui);
                primary.setOCM(o.colModel);
                primary.setCM(that.colModel);
                primary.setCols(that.columns);
                that.refreshCM(ui.CM, {
                    pivot: true
                })
            },
            setPivot: function(val) {
                this._pivot = val
            },
            transformData: function(data, sumDIs, GPMdataIndx, GMdataIndx) {
                var self = this,
                    add, prev_level, pdata = [],
                    new_rd, that = this.that,
                    primary = this.primary,
                    masterRow = {},
                    arr, labelArr = [],
                    o = that.options,
                    DM = o.dataModel,
                    GM = o.groupModel,
                    pivotColsTotal = GM.pivotColsTotal,
                    GMLen = GMdataIndx.length,
                    objCM = {},
                    GPMLen = GPMdataIndx.length;
                data.forEach(function(rd) {
                    var level = rd.pq_level,
                        PM_level = level - GMLen,
                        _objCM = objCM,
                        di = GPMdataIndx[level],
                        val = rd[di],
                        i, _val;
                    if (PM_level >= 0) {
                        labelArr[PM_level] = val;
                        for (i = 0; i < PM_level + 1; i++) {
                            _val = labelArr[i];
                            _objCM = _objCM[_val] = _objCM[_val] || {}
                        }
                    }
                    if (level === GPMLen - 1) {
                        sumDIs.forEach(function(sumDI) {
                            arr = labelArr.slice();
                            arr.push(sumDI);
                            new_rd[arr.join("_")] = rd[sumDI]
                        })
                    } else {
                        if (!new_rd || prev_level > level && level < GMLen) {
                            new_rd = {
                                pq_gid: self.idCount++
                            };
                            add = true
                        }
                        if (level < GMLen) {
                            masterRow[di] = new_rd[di] = val
                        }
                        if (pivotColsTotal) {
                            if (level <= GPMLen - 2 && level >= GMLen - 1) {
                                sumDIs.forEach(function(sumDI) {
                                    arr = labelArr.slice(0, PM_level + 1);
                                    arr.push("aggr");
                                    arr.push(sumDI);
                                    new_rd[arr.join("_")] = rd[sumDI]
                                })
                            }
                        }
                    }
                    prev_level = level;
                    if (add) {
                        pdata.push(new_rd);
                        GMdataIndx.forEach(function(di) {
                            if (new_rd[di] === undefined) {
                                new_rd[di] = masterRow[di]
                            }
                        });
                        add = false
                    }
                });
                primary.setDMData(DM.data);
                DM.data = that.pdata = pdata;
                if (pivotColsTotal) this.addAggrInCM(objCM, GM.pivotTotalForSingle);
                return objCM
            },
            addAggrInCM: function(CM, pivotTotalForSingle) {
                var count = 0,
                    key;
                for (key in CM) {
                    count++;
                    this.addAggrInCM(CM[key], pivotTotalForSingle)
                }
                if (count > (pivotTotalForSingle ? 0 : 1)) {
                    CM.aggr = {}
                }
            },
            updateAgg: function(agg, oldAgg) {
                var cols = this.that.columns,
                    key;
                if (oldAgg) {
                    for (key in oldAgg) {
                        cols[key].summary = null
                    }
                }
                if (agg) {
                    for (key in agg) {
                        cols[key].summary = {
                            type: agg[key]
                        }
                    }
                }
            }
        },
        p = $.paramquery.cGroup.prototype;
    for (var method in _p) {
        old[method] = p[method];
        p[method] = _p[method]
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    _pq.pqGrid.defaults.toolPanel = {};
    _pq.pqGrid.prototype.ToolPanel = function() {
        return this.iToolPanel
    };
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iToolPanel = new _pq.cToolPanel(grid)
    });
    _pq.cToolPanel = function(that) {
        var self = this;
        self.that = that;
        self.clsSort = "pq-sortable";
        that.one("render", self.init.bind(self))
    };
    _pq.cToolPanel.prototype = {
        getArray: function($ele) {
            return $ele.find(".pq-pivot-col").get().map(function(col) {
                return col.id
            })
        },
        getInit: function() {
            return this._inited
        },
        getObj: function($ele) {
            var obj = {};
            $ele.find(".pq-pivot-col").each(function(i, col) {
                obj[col.id] = col.getAttribute("type") || "sum"
            });
            return obj
        },
        getSortCancel: function() {
            return this._sortCancel
        },
        _hide: function(hide) {
            this.$ele[hide ? "hide" : "show"]();
            this.init();
            this.that.refresh({
                soft: true
            })
        },
        hide: function() {
            this._hide(true)
        },
        init: function() {
            var self = this,
                $ele = self.$ele = self.that.$toolPanel;
            if (self.isVisible() && !self.getInit()) {
                var that = self.that,
                    o = that.options,
                    TPM = o.toolPanel,
                    pivot = o.groupModel.pivot,
                    labelCls = " pq-pivot-label ",
                    cls = " pq-pivot-pane pq-border-1 ",
                    hideColPane = self.isHideColPane(),
                    hidePivotChkBox = TPM.hidePivotChkBox,
                    pivot_checked = pivot ? "checked" : "",
                    clsSort = self.clsSort;
                $ele.html(["<div class='pq-pivot-cols-all", cls, "'>", "<div class='", clsSort, "' style='", hidePivotChkBox ? "padding-top:0;" : "", "'></div>", hidePivotChkBox ? "" : ["<div class='", labelCls, "'>", "<label><input type='checkbox' class='pq-pivot-checkbox' ", pivot_checked, "/>", o.strTP_pivot, "</label>", "</div>"].join(""), "</div>", "<div class='pq-pivot-rows", cls, "' style='display:", TPM.hideRowPane ? "none" : "", ";'>", "<div deny='denyGroup' class='", clsSort, "'></div>", "<div class='", labelCls, "'><span class='pq-icon'></span>", o.strTP_rowPane, "</div>", "</div>", "<div class='pq-pivot-cols", cls, "' style='display:", hideColPane ? "none" : "", ";'>", "<div deny='denyPivot' class='", clsSort, "'></div>", "<div class='", labelCls, "'><span class='pq-icon'></span>", o.strTP_colPane, "</div>", "</div>", "<div class='pq-pivot-vals", cls, "' style='display:", TPM.hideAggPane ? "none" : "", ";'>", "<div deny='denyAgg' class='", clsSort, "'></div>", "<div class='", labelCls, "'><span class='pq-icon'></span>", o.strTP_aggPane, "</div>", "</div>"].join(""));
                self.$pivotChk = $ele.find(".pq-pivot-checkbox").on("click", self.onPivotChange(self, that));
                self.$colsAll = $ele.find(".pq-pivot-cols-all>." + clsSort);
                self.$colsPane = $ele.find(".pq-pivot-cols");
                self.$cols = $ele.find(".pq-pivot-cols>." + clsSort);
                self.$rows = $ele.find(".pq-pivot-rows>." + clsSort);
                self.$aggs = $ele.find(".pq-pivot-vals>." + clsSort).on("click contextmenu", self.onClick.bind(self));
                that.on("refreshFull", self.setHt.bind(self)).on("groupOption", self.onGroupOption.bind(self));
                setTimeout(function() {
                    if (that.element) {
                        that.on("CMInit", self.onCMInit.bind(self));
                        self.render()
                    }
                });
                self.setInit()
            }
        },
        isHideColPane: function() {
            var o = this.that.options;
            return o.toolPanel.hideColPane || !o.groupModel.pivot
        },
        isDeny: function($source, $dest, $item) {
            var deny = $dest.attr("deny"),
                that = this.that,
                columns = that.iGroup.getColsPrimary(),
                col = columns[$item[0].id];
            return col[deny]
        },
        isVisible: function() {
            return this.$ele.is(":visible")
        },
        onCMInit: function(evt, ui) {
            if (!ui.pivot && !ui.flex && !ui.group && !this.that.Group().isPivot()) this.refresh()
        },
        onClick: function(evt) {
            var $target = $(evt.target),
                self = this,
                that = self.that;
            if ($target.hasClass("pq-pivot-col")) {
                var di = $target[0].id,
                    col = that.iGroup.getColsPrimary()[di],
                    aggOptions = that.iGroup.getAggOptions(col.dataType).sort(),
                    options = {
                        dataModel: {
                            data: aggOptions.map(function(item) {
                                return [item]
                            })
                        },
                        cellClick: function(evt, ui) {
                            var type = ui.rowData[0],
                                self2 = this;
                            $target.attr("type", type);
                            setTimeout(function() {
                                self2.destroy();
                                self.refreshGrid();
                                self.refresh()
                            })
                        }
                    };
                pq.Select(options, $target);
                return false
            }
        },
        onGroupOption: function(evt, ui) {
            if (ui.source !== "tp") {
                var oldGM = ui.oldGM,
                    GM = this.that.options.groupModel;
                if (GM.groupCols !== oldGM.groupCols || GM.agg !== oldGM.agg || GM.dataIndx !== oldGM.dataIndx || GM.pivot !== oldGM.pivot) this.refresh()
            }
        },
        onPivotChange: function(self, that) {
            return function() {
                var pivot = !!this.checked,
                    ui = {
                        pivot: pivot
                    };
                that.Group().option(ui, null, "tp");
                self.showHideColPane()
            }
        },
        ph: function(str) {
            return "<span style='color:#999;margin:1px;display:inline-block;'>" + str + "</span>"
        },
        refreshGrid: function() {
            var self = this,
                that = self.that,
                cols = self.getArray(self.$cols),
                aggs = self.getObj(self.$aggs),
                rows = self.getArray(self.$rows);
            that.Group().option({
                groupCols: cols,
                dataIndx: rows,
                agg: aggs,
                on: !!rows.length
            }, null, "tp");
            setTimeout(function() {
                self.refresh()
            })
        },
        onReceive: function(evt, ui) {
            if (this.getSortCancel()) {
                return this.setSortCancel(false)
            }
            this.refreshGrid()
        },
        onOver: function(self) {
            return function(evt, ui) {
                var $dest = $(this),
                    $item = ui.item,
                    $source = $item.parent(),
                    add = "addClass",
                    remove = "removeClass",
                    isDeny = $source[0] !== $dest[0] ? self.isDeny($source, $dest, $item) : false;
                ui.helper.find(".ui-icon")[isDeny ? add : remove]("ui-icon-closethick")[isDeny ? remove : add]("ui-icon-check")
            }
        },
        onStop: function(self) {
            return function(evt, ui) {
                var $source = $(this),
                    $item = ui.item,
                    $dest = $item.parent();
                if ($source[0] !== $dest[0]) {
                    if (self.isDeny($source, $dest, $item)) {
                        $source.sortable("cancel");
                        self.setSortCancel(true)
                    }
                }
            }
        },
        onTimer: function() {
            var timeID;
            return function(evt, ui) {
                clearTimeout(timeID);
                var self = this;
                timeID = setTimeout(function() {
                    self.onReceive(evt, ui)
                })
            }
        }(),
        refresh: function() {
            this.setHtml();
            $(this.panes).sortable("refresh")
        },
        render: function() {
            var self = this,
                connectSort = "." + self.clsSort,
                that = self.that;
            if (!that.element) {
                return
            }
            self.panes = [self.$colsAll, self.$cols, self.$rows, self.$aggs];
            self.setHtml();
            $(self.panes).sortable({
                appendTo: self.$ele,
                connectWith: connectSort,
                containment: self.$ele,
                cursor: "move",
                items: "> .pq-pivot-col:not('.pq-deny-drag')",
                helper: function(evt, ele) {
                    return ele.clone(true).css({
                        opacity: "0.8"
                    }).prepend("<span class='ui-icon-check ui-icon'></span>")
                },
                receive: self.onTimer.bind(self),
                stop: self.onStop(self),
                over: self.onOver(self),
                update: self.onTimer.bind(self),
                tolerance: "pointer"
            });
            that._trigger("tpRender")
        },
        setHtml: function() {
            var self = this,
                that = self.that,
                htmlColsAll = [],
                htmlCols = [],
                htmlRows = [],
                htmlVals = [],
                template = self.template,
                templateVals = self.templateVals,
                objGPM = {},
                o = that.options,
                Group = that.iGroup,
                columns = Group.getColsPrimary(),
                CM = Group.getCMPrimary(),
                col, di, GM = o.groupModel,
                GMdataIndx = GM.dataIndx,
                groupCols = GM.groupCols;
            GMdataIndx.concat(groupCols).forEach(function(di) {
                objGPM[di] = 1
            });
            self.$pivotChk[0].checked = GM.pivot;
            self.showHideColPane();
            for (var i = 0, len = CM.length; i < len; i++) {
                col = CM[i];
                di = col.dataIndx;
                if (col.tpHide || objGPM[di]) {} else if (col.summary && col.summary.type) {
                    htmlVals.push(templateVals(di, col))
                } else {
                    htmlColsAll.push(template(di, col))
                }
            }
            GMdataIndx.forEach(function(di) {
                htmlRows.push(template(di, columns[di]))
            });
            groupCols.forEach(function(di) {
                htmlCols.push(template(di, columns[di]))
            });
            self.$colsAll.html(htmlColsAll.join(""));
            self.$rows.html(htmlRows.join("") || self.ph(o.strTP_rowPH));
            self.$cols.html(htmlCols.join("") || self.ph(o.strTP_colPH));
            self.$aggs.html(htmlVals.join("") || self.ph(o.strTP_aggPH))
        },
        setAttrPanes: function() {
            this.$ele.attr("panes", this.panes.filter(function($ele) {
                return $ele.is(":visible")
            }).length)
        },
        setHt: function() {
            this.$ele.height(this.$ele.parent()[0].offsetHeight)
        },
        setSortCancel: function(val) {
            this._sortCancel = val
        },
        setInit: function() {
            this._inited = true
        },
        show: function() {
            this._hide(false)
        },
        showHideColPane: function() {
            var self = this;
            self.$colsPane.css("display", self.isHideColPane() ? "none" : "");
            self.setAttrPanes()
        },
        template: function(di, col) {
            return ["<div id='", di, "' class='pq-pivot-col pq-border-2 ", col.tpCls || "", "'>", col.title, "</div>"].join("")
        },
        templateVals: function(di, col) {
            var type = col.summary.type;
            return ["<div id='", di, "' type='", type, "' class='pq-pivot-col pq-border-2 ", col.tpCls || "", "'>", type, "(", col.title, ")</div>"].join("")
        },
        toggle: function() {
            this._hide(this.isVisible())
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        grid.iHeaderMenu = new cHeaderMenu(grid);
        grid.HeaderMenu = function() {
            return grid.iHeaderMenu
        }
    });

    function cHeaderMenu(that) {
        var self = this;
        self.that = that;
        that.on("headerCellClick", self.onHeadCellClick.bind(self)).on("headerClick", self.onHeadClick.bind(self)).on("destroy", self.onDestroy.bind(self))
    }
    cHeaderMenu.prototype = {
        close: function() {
            this.$popup.remove();
            this.$popup = null
        },
        popup: function() {
            return this.$popup
        },
        openFilterTab: function() {
            var index = this.$popup.find("a[href='tabs-filter']").closest("li").index();
            this.$tabs.tabs("option", "active", index);
            return this.filterMenu
        },
        FilterMenu: function() {
            return this.filterMenu
        },
        getCM: function() {
            var title = this.that.options.strSelectAll || "Select All";
            return this.nested ? [{
                editor: false,
                dataIndx: "title",
                title: title,
                useLabel: true,
                filter: {
                    crules: [{
                        condition: "contain"
                    }]
                }
            }, {
                hidden: true,
                dataIndx: "visible",
                dataType: "bool"
            }] : [{
                type: "checkbox",
                cbId: "visible",
                dataIndx: "title",
                title: title,
                useLabel: true,
                filter: {
                    crules: [{
                        condition: "contain"
                    }]
                },
                editor: false
            }, {
                dataIndx: "visible",
                hidden: true,
                cb: {
                    header: true
                },
                dataType: "bool"
            }]
        },
        getData: function() {
            var id = 1,
                self = this,
                that = self.that,
                iRH = that.iRenderHead;
            return that.Columns().reduce(function(col) {
                var ci = this.getColIndx({
                        column: col
                    }),
                    visible = !col.hidden,
                    hasChild = col.childCount;
                if (!col.menuInHide && !col.collapsible) {
                    if (hasChild) {
                        self.nested = true
                    }
                    return {
                        visible: hasChild ? undefined : visible,
                        title: hasChild ? col.title : iRH.getTitle(col, ci) || col.dataIndx,
                        column: col,
                        id: id++,
                        pq_disable: col.menuInDisable,
                        pq_close: col.menuInClose,
                        colModel: hasChild ? col.colModel : undefined
                    }
                }
            })
        },
        getGridObj: function() {
            var self = this,
                gridOptions = "gridOptions",
                that = self.that;
            return $.extend({
                dataModel: {
                    data: self.getData()
                },
                colModel: self.getCM(),
                check: self.onChange.bind(self),
                treeExpand: self.onTreeExpand.bind(self),
                treeModel: self.nested ? {
                    dataIndx: "title",
                    childstr: "colModel",
                    checkbox: true,
                    checkboxHead: true,
                    cbId: "visible",
                    cascade: true,
                    useLabel: true
                } : undefined
            }, that.options.menuUI[gridOptions])
        },
        onChange: function(evt, ui) {
            if (ui.init) {
                return
            }
            var diShow = [],
                diHide = [];
            (ui.getCascadeList ? ui.getCascadeList() : ui.rows).forEach(function(obj) {
                var rd = obj.rowData,
                    visible = rd.visible,
                    column = rd.column,
                    di = column.dataIndx,
                    CM = column.colModel;
                if (!CM || !CM.length) {
                    if (visible) diShow.push(di);
                    else diHide.push(di)
                }
            });
            this.that.Columns().hide({
                diShow: diShow,
                diHide: diHide
            })
        },
        onDestroy: function() {
            var $popup = this.$popup;
            if ($popup) $popup.remove();
            delete this.$popup
        },
        onHeadCellClick: function(evt, ui) {
            var self = this,
                $target = $(evt.originalEvent.target);
            if ($target.hasClass("pq-filter-icon")) {
                return self.onFilterClick(evt, ui, $target)
            } else if ($target.hasClass("pq-menu-icon")) {
                return self.onMenuClick(evt, ui, $target)
            }
        },
        onHeadClick: function(evt, ui) {
            if (this.that.getColModel().find(function(col) {
                    return !col.hidden
                }) === null) {
                return this.onMenuClick(evt, ui)
            }
        },
        getMenuHtml: function(tabs) {
            var icons = {
                    hideCols: "visible",
                    filter: "filter"
                },
                li = tabs.map(function(tab) {
                    return ['<li><a href="#tabs-', tab, '"><span class="pq-tab-', icons[tab], '-icon">&nbsp;</span></a></li>'].join("")
                }).join(""),
                div = tabs.map(function(tab) {
                    return '<div id="tabs-' + tab + '"></div>'
                }).join("");
            return ["<div class='pq-head-menu pq-theme'>", "<div class='pq-tabs' style='border-width:0;'>", "<ul>", li, "</ul>", div, "</div>", "</div>"].join("")
        },
        getMenuH: function(options, column) {
            return $.extend({}, options.menuUI, column.menuUI)
        },
        open: function(di, evt, $target) {
            var self = this,
                that = self.that,
                menuH, tabs, column;
            evt = evt || that.getCellHeader({
                dataIndx: di
            });
            if (di !== null) {
                column = that.columns[di];
                menuH = self.menuH = self.getMenuH(that.options, column);
                tabs = menuH.tabs
            } else {
                tabs = ["hideCols"]
            }
            var $popup = self.$popup = $(self.getMenuHtml(tabs)).appendTo(document.body),
                $tabs = this.$tabs = $popup.find(".pq-tabs");
            if (tabs.indexOf("hideCols") > -1) {
                var $grid = self.$grid = $("<div/>").appendTo($popup.find("#tabs-hideCols"));
                self.grid = pq.grid($grid, self.getGridObj());
            }
            if (tabs.indexOf("filter") > -1) {
                self.appendFilter($popup.find("#tabs-filter"), column)
            }
            pq.makePopup(self.$popup[0]);
            $tabs.tabs({
                active: localStorage["pq-menu-tab"] || 1,
                activate: function(evt, ui) {
                    localStorage["pq-menu-tab"] = $(this).tabs("option", "active");
                    $(ui.newPanel).find(".pq-grid").pqGrid("refresh")
                }
            });
            $popup.resizable({
                handles: "e,w",
                maxWidth: 600,
                minWidth: 220
            });
            $popup.position({
                my: "left top",
                at: "left bottom",
                of: $target || evt
            });
            return this
        },
        onMenuClick: function(evt, ui, $target) {
            this.open(ui.dataIndx, evt, $target);
            return false
        },
        onTreeExpand: function(evt, ui) {
            ui.nodes.forEach(function(rd) {
                rd.column.menuInClose = ui.close
            })
        },
        appendFilter: function($cont, column) {
            var self = this,
                grid = self.that,
                $div = $("<div class='pq-filter-menu pq-theme'/>").appendTo($cont),
                $popup = self.$popup || $div,
                filterMenu, html;
            filterMenu = self.filterMenu = new pq.cFilterMenu;
            var ui2 = {
                filterRow: $cont.is(document.body),
                grid: grid,
                column: column,
                $popup: $popup,
                menuH: this.menuH || this.getMenuH(grid.options, column)
            };
            filterMenu.init(ui2);
            html = filterMenu.getHtml();
            $div.html(html);
            filterMenu.ready($div.children().get());
            filterMenu.addEvents();
            $popup.on("remove", function() {
                self.$popup = self.filterMenu = null
            });
            return $div
        },
        onFilterClick: function(evt, ui, $target) {
            var $div = this.$popup = this.appendFilter($(document.body), ui.column);
            pq.makePopup($div[0]);
            $div.position({
                my: "left top",
                at: "left bottom",
                of: $target
            });
            return false
        }
    }
})(jQuery);
(function($) {
    var cFilterMenu = pq.cFilterMenu = function() {};
    cFilterMenu.select = function(that, column) {
        this.that = that;
        this.di1 = "selected", this.grid = null;
        this.column = column
    };
    cFilterMenu.select.prototype = {
        change: function(applyFilter) {
            this.onChange(applyFilter).call(this.grid)
        },
        create: function($grid, filterUI, btnOk) {
            var self = this,
                that = self.that,
                obj = self.getGridObj(filterUI, btnOk),
                trigger = function(evtName) {
                    var cb = filterUI[evtName];
                    cb && cb.call(that, ui);
                    that._trigger(evtName, null, ui)
                },
                ui = $.extend({
                    obj: obj,
                    column: self.column
                }, filterUI);
            trigger("selectGridObj");
            ui.grid = self.grid = pq.grid($grid, obj);
            trigger("selectGridCreated");
            return self.grid
        },
        getCM: function(column, di1, groupIndx, labelIndx, maxCheck, filterUI) {
            var di = column.dataIndx,
                col = $.extend({
                    filter: {
                        crules: [{
                            condition: "contain"
                        }]
                    },
                    align: "left",
                    format: filterUI.format || column.format,
                    deFormat: column.deFormat,
                    title: column.pq_title || column.title,
                    dataType: column.dataType,
                    dataIndx: di,
                    editor: false,
                    useLabel: true,
                    renderLabel: this.getRenderLbl(labelIndx, di, this.that.options.strBlanks)
                }, groupIndx ? {} : {
                    type: "checkbox",
                    cbId: di1
                });
            return groupIndx ? [col, {
                dataIndx: di1,
                dataType: "bool",
                hidden: true
            }, {
                dataIndx: groupIndx,
                hidden: true
            }] : [col, {
                dataIndx: di1,
                dataType: "bool",
                hidden: true,
                cb: {
                    header: !maxCheck,
                    maxCheck: maxCheck
                }
            }]
        },
        getData: function(filterUI, filter) {
            var column = this.column,
                grid = this.that,
                valObj = {},
                di1 = this.di1,
                di = column.dataIndx,
                maxCheck = filterUI.maxCheck,
                value = pq.filter.getVal(filter)[0],
                options = pq.filter.getOptions(column, filterUI, grid, true);
            if (!$.isArray(value)) {
                if (maxCheck === 1) {
                    value = [value]
                } else {
                    value = []
                }
            } else if (maxCheck) {
                value = value.slice(0, maxCheck)
            }
            value.forEach(function(val) {
                valObj[val] = true
            });
            if (value.length) {
                options.forEach(function(rd) {
                    rd[di1] = valObj[rd[di]]
                })
            } else {
                options.forEach(function(rd) {
                    rd[di1] = !maxCheck
                })
            }
            return options
        },
        getGridObj: function(filterUI, btnOk) {
            var self = this,
                column = self.column,
                options = self.that.options,
                filter = column.filter,
                gridOptions = "gridOptions",
                groupIndx = filterUI.groupIndx,
                maxCheck = filterUI.maxCheck,
                di1 = self.di1,
                data = self.getData(filterUI, filter),
                labelIndx = data && data.length && data[0].pq_label !== null ? "pq_label" : filterUI.labelIndx;
            self.filterUI = filterUI;
            return $.extend({
                colModel: self.getCM(column, di1, groupIndx, labelIndx, maxCheck, filterUI),
                check: self.onChange(!btnOk),
                filterModel: column.dataType === "bool" ? {} : undefined,
                groupModel: groupIndx ? {
                    on: true,
                    dataIndx: groupIndx ? [groupIndx] : [],
                    titleInFirstCol: true,
                    fixCols: false,
                    indent: 18,
                    checkbox: true,
                    select: false,
                    checkboxHead: !maxCheck,
                    cascade: !maxCheck,
                    maxCheck: maxCheck,
                    cbId: di1
                } : {},
                dataModel: {
                    data: data
                }
            }, options.menuUI[gridOptions], options.filterModel[gridOptions], filterUI[gridOptions])
        },
        getRenderLbl: function(labelIndx, di, strBlanks) {
            if (labelIndx === di) labelIndx = undefined;
            return function(ui) {
                var rd = ui.rowData,
                    val = rd[labelIndx];
                return !val && rd[di] === "" ? strBlanks : val
            }
        },
        onChange: function(applyFilter) {
            var self = this,
                filterUI = self.filterUI,
                maxCheck = filterUI.maxCheck,
                cond = filterUI.condition;
            return function() {
                if (applyFilter) {
                    var filtered = false,
                        column = self.column,
                        di = column.dataIndx,
                        di1 = self.di1,
                        grid = self.that,
                        value = this.getData().filter(function(rd) {
                            var selected = rd[di1];
                            if (!selected) {
                                filtered = true
                            }
                            return selected
                        }).map(function(rd) {
                            return rd[di]
                        });
                    if (filtered) {
                        grid.filter({
                            oper: "add",
                            rule: {
                                dataIndx: di,
                                condition: cond,
                                value: maxCheck === 1 ? value[0] : value
                            }
                        })
                    } else {
                        grid.filter({
                            rule: {
                                dataIndx: di,
                                condition: cond,
                                value: []
                            }
                        })
                    }
                    self.refreshRowFilter()
                }
            }
        },
        refreshRowFilter: function() {
            this.that.iRenderHead.postRenderCell(this.column)
        }
    };
    cFilterMenu.prototype = {
        addEvents: function() {
            var self = this;
            self.$sel0.on("change", self.onSel1Change.bind(self));
            self.$sel1.on("change", self.onSel2Change.bind(self));
            self.$filter_mode.on("change", self.onModeChange.bind(self));
            self.$clear.button().on("click", self.clear.bind(self));
            self.$ok.button().on("click", self.ok.bind(self))
        },
        addEventsInput: function() {
            var self = this;
            if (self.$inp) {
                self.$inp.filter("[type='checkbox']").off("click").on("click", self.onInput.bind(self));
                self.$inp.filter("[type='text']").off("keyup").on("keyup", self.onInput.bind(self))
            }
        },
        clear: function() {
            var grid = this.that,
                column = this.column,
                cond = this.cond0,
                type = this.getType(cond),
                di = column.dataIndx;
            grid.filter({
                rule: {
                    dataIndx: di,
                    condition: type ? cond : undefined
                },
                oper: "remove"
            });
            this.refreshRowFilter();
            this.ready()
        },
        close: function() {
            this.$popup.remove()
        },
        filterByCond: function(filter) {
            var self = this,
                grid = self.that,
                column = self.column,
                di = column.dataIndx,
                cond0 = self.cond0,
                remove = cond0 === "",
                cond1 = self.cond1,
                filterRow = self.filterRow;
            self.showHide(cond0, cond1);
            if (!filterRow) {
                var mode = self.getModeVal(),
                    type = self.getType(cond0),
                    arr0 = self.getVal(0),
                    value = arr0[0],
                    value2 = arr0[1],
                    arr1 = self.getVal(1),
                    value21 = arr1[0],
                    value22 = arr1[1],
                    $gridR = self.$gridR
            }
            if (type === "select") {
                filter && grid.filter({
                    oper: "add",
                    rule: {
                        dataIndx: di,
                        condition: cond0,
                        value: []
                    }
                });
                if (!filterRow) {
                    self.iRange.create($gridR, self.filterUI[0], self.btnOk)
                }
            } else {
                filter && grid.filter({
                    oper: remove ? "remove" : "add",
                    rule: {
                        dataIndx: di,
                        mode: mode,
                        crules: [{
                            condition: cond0,
                            value: value,
                            value2: value2
                        }, {
                            condition: cond1,
                            value: value21,
                            value2: value22
                        }]
                    }
                })
            }
        },
        getBtnOk: function() {
            return this.$ok
        },
        getInp: function(indx) {
            return this["$inp" + indx]
        },
        getSel: function(indx) {
            return this["$sel" + indx]
        },
        getBtnClear: function() {
            return this.$clear
        },
        getHtmlInput: function(indx) {
            var name = this.column.dataIndx,
                filterUI = this.filterUI[indx < 2 ? 0 : 1],
                chk = "checkbox",
                type = filterUI.type === chk ? chk : "text",
                cls = filterUI.cls || "",
                style = filterUI.style || "",
                attr = filterUI.attr || "",
                attrStr = ["name='", name, "' class='", cls, "' style='width:100%;", style, "display:none;' ", attr].join("");
            return "<input type='" + type + "' " + attrStr + " />"
        },
        getHtml: function() {
            var self = this,
                column = self.column,
                filter = column.filter,
                menuH = self.menuH,
                rules = filter.crules || [],
                rule0 = rules[0] || filter,
                rule1 = rules[1] || {},
                options = self.that.options,
                cond0 = self.cond0 = rule0.condition,
                cond1 = self.cond1 = rule1.condition,
                filterRow = self.filterRow;
            self.readFilterUI();
            var textFields = function(indx1, indx2) {
                    return ["<div style='margin:0 auto 4px;'>", self.getHtmlInput(indx1), "</div>", "<div style='margin:0 auto 4px;'>", self.getHtmlInput(indx2), "</div>"].join("")
                },
                conds = pq.filter.getConditionsCol(this.column, self.filterUI[0]);
            return ["<div style='padding:4px;'>", "<div style='margin:0 auto 4px;'>", options.strCondition, " <select>", this.getOptionStr(conds, cond0), "</select></div>", filterRow ? "" : ["<div>", textFields(0, 1), "<div data-rel='grid' style='display:none;'></div>", menuH.singleFilter ? "" : ["<div class='filter_mode_div' style='text-align:center;display:none;margin:4px 0 4px;'>", "<label><input type='radio' name='pq_filter_mode' value='AND'/>AND</label>&nbsp;", "<label><input type='radio' name='pq_filter_mode' value='OR'/>OR</label>", "</div>", "<div style='margin:0 auto 4px;'><select>", this.getOptionStr(conds, cond1, true), "</select></div>", textFields(2, 3)].join(""), "</div>"].join(""), "<div style='margin:4px 0 0;'>", menuH.buttons.map(function(button) {
                return "<button data-rel='" + button + "' type='button' style='width:calc(50% - 4px);margin:2px;' >" + (options["str" + pq.cap1(button)] || button) + "</button>"
            }).join(""), "</div>", "</div>"].join("")
        },
        getMode: function(indx) {
            var $fm = this.$filter_mode;
            return indx >= 0 ? $fm[indx] : $fm
        },
        getModeVal: function() {
            return this.$filter_mode.filter(":checked").val()
        },
        getOptionStr: function(conditions, _cond, excludeSelect) {
            var options = [""].concat(conditions),
                self = this,
                strs = self.that.options.strConditions || {},
                optionStr;
            if (excludeSelect) {
                options = options.filter(function(cond) {
                    return self.getType(cond) !== "select"
                })
            }
            optionStr = options.map(function(cond) {
                var selected = _cond === cond ? "selected" : "";
                return '<option value="' + cond + '" ' + selected + ">" + (strs[cond] || cond) + "</option>"
            }).join("");
            return optionStr
        },
        getType: function(condition) {
            return pq.filter.getType(condition, this.column)
        },
        getVal: function(indx) {
            var column = this.column,
                cond = this["cond" + indx],
                $inp0 = this["$inp" + (indx ? "2" : "0")],
                inp0 = $inp0[0],
                $inp1 = this["$inp" + (indx ? "3" : "1")],
                val0, val1;
            if ($inp0.is("[type='checkbox']")) {
                var indeterminate = inp0.indeterminate;
                val0 = inp0.checked ? true : indeterminate ? null : false
            } else {
                if ($inp0.is(":visible")) val0 = pq.deFormat(column, $inp0.val(), cond);
                if ($inp1.is(":visible")) val1 = pq.deFormat(column, $inp1.val(), cond)
            }
            return [val0, val1]
        },
        init: function(ui) {
            var column = this.column = ui.column;
            column.filter = column.filter || {};
            this.that = ui.grid;
            this.menuH = ui.menuH;
            this.$popup = ui.$popup;
            this.filterRow = ui.filterRow
        },
        initControls: function() {
            var filterUI = this.filterUI[0],
                that = this.that,
                ui = {
                    column: this.column,
                    headMenu: true
                };
            ui.$editor = $([this.$inp0[0], this.$inp1[0]]);
            ui.condition = this.cond0;
            ui.type = filterUI.type;
            ui.filterUI = filterUI;
            filterUI.init.find(function(i) {
                return i.call(that, ui)
            });
            filterUI = this.filterUI[1];
            ui.$editor = $([this.$inp2[0], this.$inp3[0]]);
            ui.condition = this.cond1;
            ui.type = filterUI.type;
            ui.filterUI = filterUI;
            filterUI.init.find(function(i) {
                return i.call(that, ui)
            })
        },
        isInputHidden: function(type) {
            if (type === "select" || !type) {
                return true
            }
        },
        ok: function() {
            var cond = this.cond0;
            if (this.getType(cond) === "select" && !this.filterRow) {
                this.iRange.change(true)
            } else if (cond) {
                this.filterByCond(true)
            }
            this.close();
            this.refreshRowFilter()
        },
        onModeChange: function() {
            this.filterByCond(!this.btnOk)
        },
        onInput: function(evt) {
            var $inp = $(evt.target),
                filter = !this.btnOk;
            if ($inp.is(":checkbox")) {
                $inp.pqval({
                    incr: true
                })
            }
            this.filterByCond(filter);
            if (filter) this.refreshRowFilter()
        },
        onSel1Change: function() {
            var filter = !this.btnOk;
            this.cond0 = this.getSel(0).val();
            this.readFilterUI();
            if (!this.filterRow) {
                this.$inp0.replaceWith(this.getHtmlInput(0));
                this.$inp1.replaceWith(this.getHtmlInput(1));
                this.refreshInputVarsAndEvents();
                this.initControls()
            }
            this.filterByCond(filter);
            this.refreshRowFilter()
        },
        onSel2Change: function() {
            this.cond1 = this.getSel(1).val();
            this.readFilterUI();
            this.$inp2.replaceWith(this.getHtmlInput(2));
            this.$inp3.replaceWith(this.getHtmlInput(3));
            this.refreshInputVarsAndEvents();
            this.initControls();
            this.filterByCond(!this.btnOk)
        },
        ready: function(node) {
            this.node = node = node || this.node;
            var $node = $(node),
                self = this,
                that = self.that,
                column = self.column,
                filter = column.filter,
                rules = filter.crules || [],
                rule0 = rules[0] || filter,
                rule1 = rules[1] || {},
                cond0 = self.cond0 = rule0.condition,
                cond1 = self.cond1 = rule1.condition,
                type0, type1, $sel, filterUI = self.readFilterUI();
            self.iRange = new pq.cFilterMenu.select(that, column);
            type0 = self.getType(cond0);
            type1 = self.getType(cond1);
            $sel = self.$select = $node.find("select");
            self.$sel0 = $($sel[0]).val(cond0);
            self.$sel1 = $($sel[1]).val(cond1);
            self.$filter_mode = $node.find('[name="pq_filter_mode"]');
            self.$clear = $node.find("[data-rel='clear']");
            self.$ok = $node.find("[data-rel='ok']");
            self.btnOk = self.$ok.length;
            if (!self.filterRow) {
                self.refreshInputVarsAndEvents();
                self.$gridR = $node.find("[data-rel='grid']");
                self.$filter_mode.filter("[value=" + filter.mode + "]").attr("checked", "checked");
                self.$filter_mode_div = $node.find(".filter_mode_div");
                self.showHide(cond0, cond1);
                if (type0 === "select") {
                    self.iRange.create(self.$gridR, filterUI[0], self.btnOk)
                } else {
                    self.readyInput(0, type0, rule0)
                }
                self.readyInput(1, type1, rule1);
                self.initControls()
            }
        },
        readyInput: function(indx, type, rule) {
            var column = this.column,
                cond = this["cond" + indx],
                $inp0 = this["$inp" + (indx ? "2" : "0")],
                $inp1 = this["$inp" + (indx ? "3" : "1")];
            if ($inp0.is(":checkbox")) {
                $inp0.pqval({
                    val: rule.value
                })
            }
            $inp0.val(pq.formatEx(column, rule.value, cond));
            if (type === "textbox2") {
                $inp1.val(pq.formatEx(column, rule.value2, cond))
            }
        },
        readFilterUI: function() {
            var fu = this.filterUI = [],
                grid = this.that,
                ui = {
                    column: this.column,
                    condition: this.cond0,
                    indx: 0,
                    headMenu: true
                };
            fu[0] = pq.filter.getFilterUI(ui, grid);
            ui.condition = this.cond1;
            ui.indx = 1;
            fu[1] = pq.filter.getFilterUI(ui, grid);
            return fu
        },
        refreshInputVarsAndEvents: function() {
            var self = this,
                column = self.column,
                $inp = self.$inp = $(this.node).find("input[name='" + column.dataIndx + "']"),
                inp0 = $inp[0],
                inp1 = $inp[1],
                inp2 = $inp[2],
                inp3 = $inp[3];
            self.$inp0 = $(inp0);
            self.$inp1 = $(inp1);
            self.$inp2 = $(inp2);
            self.$inp3 = $(inp3);
            self.addEventsInput()
        },
        refreshRowFilter: function() {
            this.that.refreshHeaderFilter({
                dataIndx: this.column.dataIndx
            })
        },
        SelectGrid: function() {
            return this.$gridR.pqGrid("instance")
        },
        showHide: function(condition, condition2) {
            if (this.filterRow) {
                return
            }
            var self = this,
                $mode = self.$filter_mode_div,
                $sel1 = self.$sel1,
                type = self.getType(condition),
                type2, $inp = self.$inp;
            if (type === "select") {
                self.$gridR.show();
                if (self.$gridR.hasClass("pq-grid")) {
                    self.$gridR.pqGrid("destroy")
                }
                $inp.hide();
                $mode.hide();
                $sel1.hide()
            } else {
                self.$gridR.hide();
                if (condition) {
                    self.$inp0[self.isInputHidden(type) ? "hide" : "show"]();
                    self.$inp1[type === "textbox2" ? "show" : "hide"]();
                    $mode.show();
                    $sel1.show();
                    if (condition2) {
                        type2 = self.getType(condition2);
                        self.$inp2[self.isInputHidden(type2) ? "hide" : "show"]();
                        self.$inp3[type2 === "textbox2" ? "show" : "hide"]()
                    } else {
                        self.$inp2.hide();
                        self.$inp3.hide()
                    }
                } else {
                    $inp.hide();
                    $mode.hide();
                    $sel1.hide()
                }
            }
        },
        updateConditions: function() {
            var filter = this.column.filter;
            filter.crules = filter.crules || [{}];
            filter.crules[0].condition = this.cond0;
            if (this.cond1) {
                filter.crules[1] = filter.crules[1] || {};
                filter.crules[1].condition = this.cond1
            }
        }
    }
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    $(document).on("pqGrid:bootup", function(evt, ui) {
        var grid = ui.instance;
        new _pq.cEditor(grid)
    });
    _pq.cEditor = function cEditor(that) {
        var self = this;
        self.that = that;
        that.on("editorBeginDone", function(evt, ui) {
            ui.$td[0].edited = true;
            self.fixWidth(ui);
            setTimeout(function() {
                if (document.body.contains(ui.$editor[0])) self.fixWidth(ui)
            })
        }).on("editorEnd", function(evt, ui) {
            ui.$td[0].edited = false;
            cancelAnimationFrame(self.id)
        }).on("editorKeyDown", function(evt, ui) {
            self.id = requestAnimationFrame(function() {
                self.fixWidth(ui)
            })
        })
    };
    _pq.cEditor.prototype = {
        escape: function(val) {
            val = val.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/</g, "&lt;");
            return val.replace(/(\n)$/, "$1A")
        },
        fixWidth: function(ui) {
            var self = this,
                that = self.that,
                $td = ui.$td,
                td = $td[0],
                widthTD = td.offsetWidth,
                heightTD = td.offsetHeight,
                height, $grid = that.widget(),
                $editor = ui.$editor,
                editorType = $editor[0].type;
            if (editorType === "text" || editorType === "textarea") {
                var val = self.escape($editor.val()),
                    gridWd = $grid.width(),
                    $span = $("<span style='position:absolute;top:0;left:0;visibilty:hidden;'><pre>" + val + "</pre></span>").appendTo($grid),
                    width = parseInt($span.width()) + 25;
                $span.remove();
                width = width > gridWd ? gridWd : width > widthTD ? width : widthTD;
                if (editorType === "textarea") {
                    var $ed = $editor.clone().appendTo($grid),
                        ed = $ed[0];
                    $ed.css({
                        height: 18,
                        width: width,
                        position: "absolute",
                        left: 0,
                        top: 0,
                        overflow: "hidden"
                    });
                    height = ed.scrollHeight + 5;
                    $ed.remove();
                    $editor.css({
                        height: height,
                        width: width,
                        resize: "none",
                        overflow: "hidden"
                    })
                }
            } else {
                width = widthTD;
                height = heightTD
            }
            $editor.css("width", width + "px");
            self.position($editor, $grid, $td)
        },
        position: function($editor, $grid, $td) {
            $editor.closest(".pq-editor-outer").css("border-width", "0").position({
                my: "left center",
                at: "left center",
                of: $td,
                collision: "fit",
                within: $grid
            })
        }
    }
})(jQuery);
(function($) {
    var pq = window.pq,
        cVirtual = pq.cVirtual = function() {
            this.diffH = 0;
            this.diffV = 0
        };
    cVirtual.setSBDim = function() {
        var $div = $("<div style='max-width:100px;height:100px;position:fixed;left:0;top:0;overflow:auto;visibility:hidden;'>" + "<div style='width:200px;height:100px;'></div></div>").appendTo(document.body),
            div = $div[0];
        this.SBDIM = div.offsetHeight - div.clientHeight;
        $div.remove()
    };
    cVirtual.prototype = {
        assignTblDims: function(left) {
            var tbl, self = this,
                isBody = self.isBody(),
                actual = true,
                ht = self.getTopSafe(this[left ? "cols" : "rows"], left, actual),
                maxHt = self.maxHt;
            if (ht > maxHt) {
                self[left ? "ratioH" : "ratioV"] = ht / maxHt;
                self[left ? "virtualWd" : "virtualHt"] = ht;
                ht = maxHt
            } else {
                ht = ht || (self.isHead() ? 0 : 1);
                self[left ? "ratioH" : "ratioV"] = 1
            }
            var tr = self.$tbl_right[0],
                $tl = self[left ? "$tbl_tr" : "$tbl_left"],
                tl = $tl.length ? $tl[0] : {
                    style: {}
                },
                prop = left ? "width" : "height";
            tr.style[prop] = ht + "px";
            tl.style[prop] = ht + "px";
            if (isBody) tbl = "Tbl";
            else if (self.isHead()) tbl = "TblHead";
            else tbl = "TblSum";
            if (!isBody && left) self.$spacer.css("left", ht);
            self.dims[left ? "wd" + tbl : "ht" + tbl] = ht;
            isBody && self.triggerTblDims(100)
        },
        calInitFinal: function(top, bottom, left) {
            var _init, _final, rows = this[left ? "cols" : "rows"],
                ri = this[left ? "freezeCols" : "freezeRows"],
                arr = this[left ? "leftArr" : "topArr"],
                found, offset = this.getTopSafe(ri, left);
            if (left) offset -= this.numColWd;
            top += offset;
            bottom += offset;
            if (ri < rows && arr[ri] < top) {
                var k = 30,
                    j2 = rows,
                    jm;
                while (k--) {
                    jm = Math.floor((ri + j2) / 2);
                    if (arr[jm] >= top) {
                        j2 = jm
                    } else if (ri === jm) {
                        found = true;
                        break
                    } else {
                        ri = jm
                    }
                }
                if (!found) {
                    throw "ri not found"
                }
            }
            for (; ri <= rows; ri++) {
                if (arr[ri] > top) {
                    _init = ri ? ri - 1 : ri;
                    break
                }
            }
            for (; ri <= rows; ri++) {
                if (arr[ri] > bottom) {
                    _final = ri - 1;
                    break
                }
            }
            if (_init === null && _final === null && rows && top > arr[rows - 1]) {
                return [null, null]
            }
            if (_init === null) _init = 0;
            if (_final === null) _final = rows - 1;
            return [_init, _final]
        },
        calInitFinalSuper: function() {
            var self = this,
                dims = this.dims || {},
                arrTB = self.calcTopBottom(),
                top = arrTB[0],
                bottom = arrTB[1],
                fullRefresh = arrTB[2],
                arrLR = self.calcTopBottom(true),
                left = arrLR[0],
                right = arrLR[1],
                arrV = self.calInitFinal(top, bottom),
                r1 = arrV[0],
                r2 = arrV[1],
                arrH = self.calInitFinal(left, right, true),
                c1 = arrH[0],
                c2 = arrH[1];
            if (this.isBody()) {
                dims.bottom = bottom;
                dims.top = top;
                dims.left = left;
                dims.right = right
            }
            fullRefresh = fullRefresh || arrLR[2];
            return [r1, c1, r2, c2, fullRefresh]
        },
        calcTopBottom: function(left) {
            var self = this,
                isBody = self.isBody(),
                dims = self.dims,
                cr = self.$cright[0],
                top, bottom;
            if (left) {
                var _stop = cr.scrollLeft,
                    stop = self.sleft,
                    htCont = dims.wdCont,
                    htContTop = self.wdContLeft,
                    ratioV = self.ratioH
            } else {
                _stop = cr.scrollTop;
                stop = self.stop;
                htCont = self.htCont;
                htContTop = self.htContTop;
                ratioV = self.ratioV
            }
            _stop = _stop < 0 ? 0 : _stop;
            if (ratioV === 1) {
                bottom = _stop + htCont - htContTop;
                if (!(bottom >= 0)) {
                    bottom = 0
                }
                return [_stop, bottom]
            } else {
                var maxHt = cVirtual.maxHt,
                    factorV, virtualHt = self[left ? "virtualWd" : "virtualHt"],
                    htContClient = left ? dims.wdContClient : dims.htContClient,
                    strDiff = left ? "diffH" : "diffV",
                    diff = self[strDiff],
                    _diff, fullRefresh, sbHeight = htCont - htContClient;
                if (_stop + htContClient >= maxHt) {
                    bottom = virtualHt - htContTop + sbHeight;
                    top = bottom - htCont + htContTop
                } else {
                    if (_stop === 0) {
                        top = 0
                    } else {
                        factorV = stop === null || Math.abs(_stop - stop) > htCont ? ratioV : 1;
                        top = _stop * factorV + (factorV === 1 && diff ? diff : 0)
                    }
                    bottom = top + htCont - htContTop
                }
                _diff = top - _stop;
                if (_diff !== diff) {
                    fullRefresh = true;
                    self[strDiff] = _diff;
                    isBody && self.triggerTblDims(3e3)
                }
                self[left ? "sleft" : "stop"] = _stop;
                if (!(_stop >= 0)) {
                    throw "stop NaN"
                }
                if (!(bottom >= 0) || !(top >= 0)) {
                    throw "top bottom NaN"
                }
                return [top, bottom, fullRefresh]
            }
        },
        getHtDetail: function(rd, rowHtDetail) {
            var pq_detail = rd.pq_detail;
            if (pq_detail) {}
            return pq_detail && pq_detail.show ? pq_detail.height || rowHtDetail : 0
        },
        getTop: function(ri, actual) {
            var top = this.topArr[ri],
                diff = actual ? 0 : this.diffV;
            if (diff) {
                top = top - (ri > this.freezeRows ? diff : 0);
                if (top < 0) top = 0
            }
            if (top >= 0) return top;
            else throw "getTop ", top
        },
        getTopSafe: function(ri, left, actual) {
            var data_len = left ? this.cols : this.rows;
            return this[left ? "getLeft" : "getTop"](ri > data_len ? data_len : ri, actual)
        },
        getLeft: function(ci, actual) {
            var offset = this.numColWd,
                left = ci === -1 ? 0 : this.leftArr[ci] + offset,
                diff = actual ? 0 : this.diffH;
            if (diff) {
                left = left - (ci > this.freezeCols ? diff : 0);
                if (left < 0) left = 0
            }
            if (left >= 0) return left;
            else throw "getLeft ", left
        },
        getHeightR: function(ri, rows) {
            rows = rows || 1;
            var arr = this.topArr,
                ht = arr[ri + rows] - arr[ri];
            if (ht >= 0) {
                return ht
            } else {
                throw "getHeight ", ht
            }
        },
        getHeightCell: function(ri, rows) {
            rows = rows || 1;
            var arr = this.topArr,
                rowHtDetail = this.rowHtDetail,
                minus, len, ht;
            minus = rowHtDetail ? this.getHtDetail(this.data[ri + rows - 1], rowHtDetail) : 0;
            ht = arr[ri + rows] - arr[ri] - minus;
            if (ht >= 0) {
                return ht
            } else {
                throw "getHeight: ", ht
            }
        },
        getHeightCellM: function(ri, rows) {
            return this.getTopSafe(ri + rows) - this.getTop(ri)
        },
        getHeightCellDirty: function(ri, rows) {
            this.setTopArr(ri, null, ri + rows);
            return this.getHeightCellM(ri, rows)
        },
        getWidthCell: function(ci) {
            if (ci === -1) {
                return this.numColWd
            }
            var wd = this.colwdArr[ci];
            if (wd >= 0) {
                return wd
            } else {
                throw "getWidthCell: ", wd
            }
        },
        getWidthCellM: function(ci, cols) {
            return this.getTopSafe(ci + cols, true) - this.getLeft(ci)
        },
        initRowHtArr: function() {
            var rowht = this.rowHt,
                data = this.data,
                len = data.length,
                rowHtDetail = this.rowHtDetail,
                rd, rowhtArr = this.rowhtArr = [],
                topArr = this.topArr = [],
                i = 0;
            if (rowHtDetail) {
                for (; i < len; i++) {
                    rd = data[i];
                    rowhtArr[i] = rd.pq_hidden ? 0 : rd.pq_ht || rowht + this.getHtDetail(rd, rowHtDetail)
                }
            } else {
                for (; i < len; i++) {
                    rd = data[i];
                    rowhtArr[i] = rd.pq_hidden ? 0 : rd.pq_ht || rowht
                }
            }
        },
        initRowHtArrDetailSuper: function(arr) {
            var rowhtArr = this.rowhtArr,
                rip, data = this.data;
            arr.forEach(function(item) {
                rip = item[0];
                rowhtArr[rip] = data[rip].pq_ht = rowhtArr[rip] + item[1]
            });
            this.setTopArr();
            this.assignTblDims()
        },
        initRowHtArrSuper: function() {
            this.initRowHtArr();
            this.setTopArr();
            this.assignTblDims()
        },
        refreshRowHtArr: function(ri, full) {
            var rd = this.data[ri],
                rowHtDetail = this.rowHtDetail,
                rowht = this.rowHt;
            this.rowhtArr[ri] = rd.pq_hidden ? 0 : rowht + this.getHtDetail(rd, rowHtDetail);
            if (full) {
                this.setTopArr(ri);
                this.assignTblDims()
            }
        },
        setTopArr: function(r1, left, r2) {
            var i = r1 || 0,
                top, self = this,
                len, final, rowhtArr, topArr;
            if (left) {
                len = self.cols;
                rowhtArr = self.colwdArr;
                topArr = self.leftArr
            } else {
                len = self.rows;
                rowhtArr = self.rowhtArr;
                topArr = self.topArr
            }
            final = r2 && r2 < len ? r2 : len - 1;
            top = i ? topArr[i] : 0;
            for (; i <= final; i++) {
                topArr[i] = top;
                top += rowhtArr[i]
            }
            topArr[i] = top;
            topArr.length = len + 1
        },
        triggerTblDims: function(t) {
            var self = this;
            self.setTimer(function() {
                self.that._trigger("assignTblDims")
            }, "assignTblDims", t)
        }
    }
})(jQuery);
(function($) {
    var MAX_HEIGHT = 1533910;
    $(function() {
        var $div = $("<div style='position:relative;'></div>").appendTo(document.body),
            idiv = $("<div style='position:absolute;left:0;'></div>").appendTo($div)[0],
            num = 1e9,
            cVirtual = pq.cVirtual;
        idiv.style.top = num + "px";
        var top = idiv.offsetTop - 50;
        MAX_HEIGHT = top <= 1e4 ? MAX_HEIGHT : top;
        if (MAX_HEIGHT > 16554378) {
            MAX_HEIGHT = 16554378
        }
        cVirtual.maxHt = MAX_HEIGHT;
        $div.remove();
        cVirtual.setSBDim();
        $(window).on("resize", cVirtual.setSBDim.bind(cVirtual))
    })
})(jQuery);
(function($) {
    var pq = window.pq = window.pq || {};

    function isund(i) {
        return i === null || isNaN(i)
    }
    pq.cRender = function() {
        this.data = []
    };
    pq.cRender.prototype = $.extend({}, {
        _m: function() {},
        autoHeight: function(ui) {
            var self = this,
                that = self.that,
                isBody = self.isBody(),
                hChanged = ui.hChanged,
                fr = self.freezeRows,
                changed = false,
                initV = self.initV,
                finalV = self.finalV;
            if (self.rows) {
                isBody && that._trigger("beforeAutoRowHeight");
                changed = self.setRowHtArr(initV, finalV, hChanged);
                changed = self.setRowHtArr(0, fr - 1, hChanged) || changed;
                if (changed) {
                    self.setTopArr(fr ? 0 : initV);
                    self.assignTblDims();
                    self.setPanes();
                    self.setCellDims(true);
                    if (isBody) {
                        ui.source = "autoRow";
                        self.refresh(ui);
                        that._trigger("autoRowHeight")
                    }
                } else {
                    self.setCellDims(true)
                }
            }
        },
        autoWidth: function(ci) {
            var self = this,
                fc = self.freezeCols,
                initH = self.initH,
                finalH = self.finalH;
            if (ci === null) {
                self.setColWdArr(initH, finalH);
                self.setColWdArr(0, fc - 1)
            } else {
                self.setColWdArr(ci, ci)
            }
        },
        _each: function(cb, init, final, data, hidden, freeze) {
            var self = this,
                jump = self.jump,
                rip = 0,
                rd;
            for (; rip <= final; rip++) {
                rip = jump(init, freeze, rip);
                rd = data[rip];
                if (!rd[hidden]) cb.call(self, rd, rip)
            }
        },
        eachV: function(cb) {
            var self = this;
            self._each(cb, self.initV, self.finalV, self.data, "pq_hidden", self.freezeRows)
        },
        eachH: function(cb) {
            var self = this;
            self._each(cb, self.initH, self.finalH, self.colModel, "hidden", self.freezeCols)
        },
        generateCell: function(rip, ci, rd, column, _region, _ht) {
            var iMerge = this.iMerge,
                _wd, v_rip, v_ci, ui, region, v_region, style = [],
                offset = this.riOffset,
                ri = rip + offset,
                cls = [this.cellCls],
                id, m;
            if (this._m() && (m = iMerge.ismergedCell(ri, ci))) {
                if (m.o_rc) {
                    ui = iMerge.getClsStyle(ri, ci);
                    ui.style && style.push(ui.style);
                    ui.cls && cls.push(ui.cls);
                    ri = m.o_ri;
                    rip = ri - offset;
                    rd = this.data[rip];
                    ci = m.o_ci;
                    column = this.colModel[ci];
                    _ht = this.getHeightCellM(rip, m.o_rc);
                    _wd = this.getWidthCellM(ci, m.o_cc);
                    cls.push("pq-merge-cell")
                } else if (rip === this._initV || ci === this._initH) {
                    region = this.getCellRegion(rip, ci);
                    ui = iMerge.getRootCell(ri, ci);
                    v_rip = ui.v_ri - offset;
                    v_ci = ui.v_ci;
                    if (v_rip < 0) {
                        return ""
                    }
                    v_region = this.getCellRegion(v_rip, v_ci);
                    this.mcLaid[v_rip + "," + v_ci + (v_region === region ? "" : "," + region)] = true;
                    return ""
                } else {
                    return ""
                }
            } else if (rd.pq_hidden || column.hidden) {
                return ""
            }
            id = this.getCellId(rip, ci, _region);
            if (this.getById(id)) {
                return ""
            }
            var ht = _ht || this.getHeightCell(rip),
                wd = _wd || this.colwdArr[ci],
                left = this.getLeft(ci);
            style.push("left:" + left + "px;width:" + wd + "px;height:" + ht + "px;");
            return this.renderCell({
                style: style,
                cls: cls,
                attr: ["role='gridcell' id='" + id + "'"],
                rowData: rd,
                rowIndxPage: rip,
                rowIndx: ri,
                colIndx: ci,
                column: column
            })
        },
        generateRow: function(rip, region) {
            var cls = "pq-grid-row",
                style = "top:" + this.getTop(rip) + "px;height:" + this.getHeightR(rip) + "px;width:100%;",
                row_id = this.getRowId(rip, region),
                attr = "role='row' id='" + row_id + "'",
                arr = this.getRowClsStyleAttr(rip);
            cls += " " + arr[0];
            style += arr[1];
            attr += " " + arr[2];
            return "<div class='" + cls + "' " + attr + " style='" + style + "'>"
        },
        getById: function(id) {
            return document.getElementById(id)
        },
        getCell: function(rip, ci, region) {
            var offset = this.riOffset,
                iM, m, ri = rip + offset;
            if (!region) {
                iM = this.iMerge;
                if (iM.ismergedCell(ri, ci)) {
                    m = iM.getRootCell(ri, ci);
                    if (this.isHead()) {
                        rip = m.o_ri;
                        ci = m.o_ci
                    }
                    region = this.getCellRegion(m.v_ri - offset, m.v_ci)
                }
            }
            return this.getById(this.getCellId(rip, ci, region))
        },
        getCellIndx: function(cell) {
            var arr = cell.id.split("-");
            if (arr[3] === "u" + this.uuid) {
                return [arr[4] * 1, arr[5] * 1, arr[6]]
            }
        },
        getCellId: function(rip, ci, region) {
            if (rip >= this.data.length) {
                return ""
            }
            region = region || this.getCellRegion(rip, ci);
            return this.cellPrefix + rip + "-" + ci + "-" + region
        },
        getCellCont: function(ri, ci) {
            return this["$c" + this.getCellRegion(ri, ci)]
        },
        getCellCoords: function(rip, ci) {
            var self = this,
                maxHt = self.maxHt,
                y1 = self.getTop(rip),
                ht = self.getHeightCell(rip),
                y2 = y1 + ht,
                y2 = y2 > maxHt ? maxHt : y2,
                y1 = y2 - ht,
                x1 = self.getLeft(ci),
                wd = self.getWidthCell(ci),
                x2 = x1 + wd,
                x2 = x2 > maxHt ? maxHt : x2,
                x1 = x2 - wd;
            return [x1, y1, x2, y2]
        },
        getCellRegion: function(rip, ci) {
            var fc = this.freezeCols,
                fr = this.freezeRows;
            if (rip < fr) {
                return ci < fc ? "lt" : "tr"
            } else {
                return ci < fc ? "left" : "right"
            }
        },
        getCellXY: function(rip, ci) {
            var maxHt = this.maxHt,
                left = Math.min(this.getLeft(ci), maxHt),
                top = Math.min(this.getTop(rip), maxHt);
            return [left, top]
        },
        getContRight: function() {
            return this.$cright
        },
        getMergeCells: function() {
            return this._m() ? this.$tbl.children().children(".pq-merge-cell") : $()
        },
        getRow: function(rip, region) {
            return this.getById(this.getRowId(rip, region))
        },
        getAllCells: function() {
            return this.$ele.children().children().children().children().children(this.isHead() ? ".pq-grid-col" : ".pq-grid-cell")
        },
        get$Col: function(ci, $cells) {
            var sel = ["right", "left", "lt", "rt"].map(function(region) {
                return "[id$=-" + ci + "-" + region + "]"
            }).join(",");
            return ($cells || this.getAllCells()).filter(sel)
        },
        get$Row: function(rip) {
            return this.$ele.find("[id^=" + this.getRowId(rip, "") + "]")
        },
        getRowClsStyleAttr: function(rip) {
            var that = this.that,
                cls = [],
                o = that.options,
                rowInit = o.rowInit,
                rd = this.data[rip],
                pq_rowcls = rd.pq_rowcls,
                rowattr = rd.pq_rowattr,
                attr = "",
                style = "",
                ri = rip + this.riOffset;
            if (rowInit) {
                var retui = rowInit.call(that, {
                    rowData: rd,
                    rowIndxPage: rip,
                    rowIndx: ri
                });
                if (retui) {
                    if (retui.cls) cls.push(retui.cls);
                    attr += retui.attr ? " " + retui.attr : "";
                    style += retui.style ? retui.style : ""
                }
            }
            o.stripeRows && this.stripeArr[rip] && cls.push("pq-striped");
            if (rd.pq_rowselect) cls.push(that.iRows.hclass);
            pq_rowcls && cls.push(pq_rowcls);
            if (rowattr) {
                var newrowattr = that.stringifyAttr(rowattr);
                for (var key in newrowattr) {
                    var val = newrowattr[key];
                    attr += " " + key + '="' + val + '"'
                }
            }
            return [cls.join(" "), style, attr]
        },
        getRowId: function(rip, region) {
            if (region === null) {
                throw "getRowId region."
            }
            return this.rowPrefix + rip + "-" + region
        },
        getRowIndx: function(row) {
            var id = row.id.split("-");
            return [id[4] * 1, id[5]]
        },
        getTable: function(ri, ci) {
            return this["$tbl_" + this.getCellRegion(ri, ci)]
        },
        getTblCls: function(o) {
            var cls = this.isBody() ? [] : ["pq-grid-summary-table"];
            if (o.rowBorders) cls.push("pq-td-border-top");
            if (o.columnBorders) cls.push("pq-td-border-right");
            if (!o.wrap) cls.push("pq-no-wrap");
            return cls.join(" ")
        },
        getFlexWidth: function() {
            return this._flexWidth
        },
        preInit: function($ele) {
            var self = this,
                isBody = self.isBody(),
                isHead = self.isHead(),
                that = self.that,
                o = that.options,
                fc = o.freezeCols || 0,
                fr = isHead ? 0 : o.freezeRows,
                tblCls = "pq-table " + self.getTblCls(o),
                cls = ["pq-cont-inner ", "pq-cont-right", "pq-cont-left", "pq-cont-lt", "pq-cont-tr"];
            $ele.empty();
            $ele[0].innerHTML = ['<div class="pq-grid-cont">', isBody ? '<div class="pq-grid-norows">' + o.strNoRows + "</div>" : "", '<div class="', cls[0] + cls[1], '"><div class="pq-table-right ' + tblCls + '"></div>', isBody ? "" : '<div class="pq-r-spacer" style="position:absolute;top:0;height:10px;"></div>', "</div>", '<div class="' + cls[0] + cls[2] + '"><div class="pq-table-left ' + tblCls + '"></div></div>', '<div class="' + cls[0] + cls[4] + '"><div class="pq-table-tr ' + tblCls + '"></div></div>', '<div class="' + cls[0] + cls[3] + '"><div class="pq-table-lt ' + tblCls + '"></div></div>', "</div>"].join("");
            self.$cright = $ele.find("." + cls[1]).on("scroll", self.onNativeScroll(self));
            if (!isBody) self.$spacer = $ele.find(".pq-r-spacer");
            self.$cleft = $ele.find("." + cls[2]).on("scroll", self.onScrollL);
            self.$clt = $ele.find("." + cls[3]).on("scroll", self.onScrollLT);
            self.$ctr = $ele.find("." + cls[4]).on("scroll", self.onScrollT);
            self.$tbl = $ele.find(".pq-table").on("scroll", self.onScrollLT);
            self.$tbl_right = $ele.find(".pq-table-right");
            self.$tbl_left = $ele.find(".pq-table-left");
            self.$tbl_lt = $ele.find(".pq-table-lt");
            self.$tbl_tr = $ele.find(".pq-table-tr");
            isBody && self.$cleft.add(self.$ctr).on("mousewheel DOMMouseScroll", self.onMouseWheel(self))
        },
        isBody: function() {},
        isHead: function() {},
        isSum: function() {},
        jump: function(initH, fc, ci) {
            if (ci < initH && ci >= fc) {
                ci = initH
            }
            return ci
        },
        hasMergeCls: function(cell) {
            return cell && cell.className.indexOf("pq-merge-cell") >= 0
        },
        initRefreshTimer: function(hChanged) {
            var self = this;
            self.setTimer(self.onRefreshTimer(self, hChanged), "refresh")
        },
        initStripeArr: function() {
            var rows = this.rows,
                i = 0,
                stripeArr = this.stripeArr = [],
                data = this.data,
                striped;
            for (; i < rows; i++) {
                if (data[i].pq_hidden) {
                    continue
                }
                striped = stripeArr[i] = !striped
            }
        },
        isRenderedRow: function(ri) {
            return !!this.getRow(ri)
        },
        onScrollLT: function() {
            this.scrollTop = this.scrollLeft = 0
        },
        onScrollT: function() {
            this.scrollTop = 0
        },
        onScrollL: function() {
            this.scrollLeft = 0
        },
        refresh: function(ui) {
            ui = ui || {};
            var self = this,
                that = self.that,
                isBody = self.isBody(),
                isHead = self.isHead(),
                timer = ui.timer === null ? true : ui.timer,
                mcLaid = self.mcLaid = {},
                fc = self.freezeCols,
                numColWd = self.numColWd,
                fcPane = fc || numColWd ? true : false,
                fr = self.freezeRows,
                arr = self.calInitFinalSuper(),
                r1 = arr[0],
                c1 = arr[1],
                r2 = arr[2],
                c2 = arr[3],
                fullRefresh = arr[4],
                initV = self.initV,
                finalV = self.finalV,
                initH = self.initH,
                finalH = self.finalH;
            isBody && that.blurEditor({
                force: true
            });
            self._initV = r1;
            self._finalV = r2;
            self._initH = c1;
            self._finalH = c2;
            isBody && that._trigger("beforeTableView", null, {
                initV: r1,
                finalV: r2,
                pageData: self.data
            });
            if (!fullRefresh) {
                if (finalV !== null && r2 >= initV && r1 <= finalV) {
                    if (r1 > initV) {
                        self.removeView(initV, r1 - 1, initH, finalH);
                        fcPane && self.removeView(initV, r1 - 1, numColWd ? -1 : 0, fc - 1)
                    } else if (r1 < initV) {
                        self.renderView(r1, initV - 1, c1, c2);
                        fcPane && self.renderView(r1, initV - 1, 0, fc - 1)
                    }
                    if (r2 < finalV) {
                        self.removeView(r2 + 1, finalV, initH, finalH);
                        fcPane && self.removeView(r2 + 1, finalV, numColWd ? -1 : 0, fc - 1)
                    } else if (r2 > finalV) {
                        self.renderView(finalV + 1, r2, c1, c2);
                        fcPane && self.renderView(finalV + 1, r2, 0, fc - 1)
                    }
                    initV = r1;
                    finalV = r2
                }
                if (finalH !== null && c2 > initH && c1 < finalH) {
                    if (c1 > initH) {
                        self.removeView(initV, finalV, initH, c1 - 1);
                        fr && self.removeView(0, fr - 1, initH, c1 - 1)
                    } else if (c1 < initH) {
                        self.renderView(initV, finalV, c1, initH - 1);
                        fr && self.renderView(0, fr - 1, c1, initH - 1)
                    }
                    if (c2 < finalH) {
                        self.removeView(initV, finalV, c2 + 1, finalH);
                        fr && self.removeView(0, fr - 1, c2 + 1, finalH)
                    } else if (c2 > finalH) {
                        self.renderView(initV, finalV, finalH + 1, c2);
                        fr && self.renderView(0, fr - 1, finalH + 1, c2)
                    }
                    initH = c1;
                    finalH = c2
                }
            }
            if (fullRefresh || (r2 !== finalV || r1 !== initV || c1 !== initH || c2 !== finalH)) {
                isBody && that._trigger("beforeViewEmpty", null, {
                    region: "right"
                });
                self.$tbl_right.empty();
                self.renderView(r1, r2, c1, c2);
                if (fcPane && (r2 !== finalV || r1 !== initV)) {
                    self.$tbl_left.empty();
                    self.renderView(r1, r2, 0, fc - 1)
                }
                if (fr) {
                    if (c1 !== initH || c2 !== finalH) {
                        that._trigger("beforeViewEmpty", null, {
                            region: "tr"
                        });
                        self.$tbl_tr.empty();
                        self.renderView(0, fr - 1, c1, c2)
                    }
                    if (fcPane && finalV === null) {
                        self.$tbl_lt.empty();
                        self.renderView(0, fr - 1, 0, fc - 1)
                    }
                }
            } else {
                self.removeMergeCells()
            }
            for (var key in mcLaid) {
                var arr = key.split(","),
                    ri = arr[0] * 1,
                    ci = arr[1] * 1,
                    region = arr[2];
                self.renderView(ri, ri, ci, ci, region)
            }
            var initHChanged = c1 !== self.initH || c2 !== self.finalH,
                hChanged = initHChanged && self.initH !== null;
            if (r2 !== self.finalV || r1 !== self.initV || initHChanged) {
                self.initV = r1;
                self.finalV = r2;
                self.initH = c1;
                self.finalH = c2;
                if (isBody) that._trigger("refresh", null, {
                    source: ui.source,
                    hChanged: hChanged
                });
                else that._trigger(isHead ? "refreshHeader" : "refreshSum", null, {
                    hChanged: hChanged
                })
            }
        },
        refreshAllCells: function(ui) {
            var self = this;
            self.initH = self.initV = self.finalH = self.finalV = null;
            self.refresh(ui)
        },
        refreshCell: function(rip, ci, rd, column) {
            var self = this,
                m = self.isBody() && self._m() ? self.iMerge.getRootCellV(rip + self.riOffset, ci) : 0,
                found, rip_o = rip,
                ci_o = ci,
                replace = function(cell, region) {
                    if (cell) {
                        found = true;
                        cell.id = "";
                        $(cell).replaceWith(self.generateCell(rip, ci, rd, column, region))
                    }
                };
            if (m) {
                rip = m.rowIndxPage;
                ci = m.colIndx;
                rd = m.rowData;
                column = m.column;
                ["lt", "tr", "left", "right"].forEach(function(region) {
                    replace(self.getCell(rip_o, ci_o, region), region)
                })
            } else {
                replace(self.getCell(rip, ci))
            }
            return found
        },
        removeMergeCells: function() {
            var self = this,
                ui, arr, r1, c1, r2, c2, remove, m = self.iMerge,
                cell, region, offset = self.riOffset,
                fc = self.freezeCols,
                fr = self.freezeRows,
                $cells = self.getMergeCells(),
                initH = self._initH,
                finalH = self._finalH,
                initV = self._initV,
                finalV = self._finalV,
                i = 0,
                len = $cells.length,
                row;
            for (; i < len; i++) {
                cell = $cells[i];
                arr = self.getCellIndx(cell);
                if (arr) {
                    r1 = arr[0];
                    c1 = arr[1];
                    region = arr[2];
                    ui = m.getRootCell(r1 + offset, c1);
                    r2 = r1 + ui.o_rc - 1;
                    c2 = c1 + ui.o_cc - 1;
                    remove = false;
                    if (r1 > finalV || c1 > finalH) {
                        remove = true
                    } else if (region === "right") {
                        if (r2 < initV || c2 < initH) remove = true
                    } else if (region === "left") {
                        if (r2 < initV) remove = true
                    } else if (region === "tr") {
                        if (c2 < initH) remove = true
                    }
                    row = cell.parentNode;
                    remove && $(cell).remove();
                    if (!row.children.length) {
                        row.parentNode.removeChild(row)
                    }
                }
            }
        },
        removeView: function(r1, r2, c1, c2) {
            var row, i, j, id, cell, region = this.getCellRegion(r1, c1);
            for (i = r1; i <= r2; i++) {
                row = this.getRow(i, region);
                if (row) {
                    for (j = c1; j <= c2; j++) {
                        cell = this.getCell(i, j, region);
                        if (cell) {
                            if (!this.hasMergeCls(cell)) {
                                $(cell).remove()
                            }
                        }
                    }
                    if (!row.children.length) {
                        row.parentNode.removeChild(row)
                    }
                }
            }
        },
        renderNumCell: function(rip, nc, region) {
            var self = this,
                ht = self.getHeightR(rip),
                isHead = self.isHead(),
                id = self.getCellId(rip, -1, region),
                style = "position:absolute;left:0;top:0;width:" + nc + "px;height:" + ht + "px;";
            return "<div id='" + id + "' style='" + style + "' role='gridcell' class='pq-grid-number-cell " + "'>" + (self.isBody() ? rip + 1 + self.riOffset : isHead && rip === self.data.length - 1 ? self.numberCell.title || "" : "") + "</div>"
        },
        renderRow: function(arr, rd, ri, c1, c2, region) {
            var row = this.getRow(ri, region),
                nc = this.numColWd,
                localArr = [],
                htCell = this.getHeightCell(ri),
                str, CM = this.colModel,
                column, ci, div;
            !row && arr.push(this.generateRow(ri, region));
            if (c1 === 0 && nc && (region === "left" || region === "lt")) {
                div = this.renderNumCell(ri, nc, region);
                localArr.push(div)
            }
            for (ci = c1; ci <= c2; ci++) {
                column = CM[ci];
                if (!column.hidden) {
                    div = this.generateCell(ri, ci, rd, column, region, htCell);
                    localArr.push(div)
                }
            }
            str = localArr.join("");
            row ? $(row).append(str) : arr.push(str, "</div>")
        },
        renderView: function(r1, r2, c1, c2, region) {
            if (c1 === null || c2 === null) {
                return
            }
            region = region || this.getCellRegion(r1, Math.min(c1, c2));
            var arr = [],
                data = this.data,
                $tbl = this["$tbl_" + region],
                ri = r1,
                rd;
            for (; ri <= r2; ri++) {
                rd = data[ri];
                if (rd && !rd.pq_hidden) {
                    this.renderRow(arr, rd, ri, c1, c2, region)
                }
            }
            $tbl.append(arr.join(""))
        },
        scrollX: function(x, fn) {
            var c = this.$cright[0];
            if (x >= 0) {
                this.scrollXY(x, c.scrollTop, fn)
            } else return c.scrollLeft
        },
        setCellDims: function(heightOnly) {
            var self = this,
                iMerge = self.iMerge,
                _mergeCells = self._m(),
                m, CM = self.colModel,
                numColWd = self.numColWd,
                jump = self.jump,
                setRowDims = self.setRowDims(),
                offset = self.riOffset,
                initH = self.initH,
                finalH = self.finalH,
                fc = self.freezeCols,
                style;
            self.eachV(function(rd, rip) {
                var $row = self.get$Row(rip),
                    ht = self.getHeightR(rip),
                    top = self.getTop(rip),
                    cell, htCell = self.getHeightCell(rip);
                setRowDims($row, ht, top);
                for (var ci = numColWd ? -1 : 0; ci <= finalH; ci++) {
                    ci = jump(initH, fc, ci);
                    if (ci < 0 || !CM[ci].hidden) {
                        if (_mergeCells && (m = iMerge.ismergedCell(rip + offset, ci))) {} else {
                            cell = self.getCell(rip, ci);
                            if (cell) {
                                style = cell.style;
                                style.height = (ci === -1 ? ht : htCell) + "px";
                                if (!heightOnly) {
                                    style.width = self.getWidthCell(ci) + "px";
                                    style.left = self.getLeft(ci) + "px"
                                }
                            }
                        }
                    }
                }
            });
            var $merge = self.getMergeCells(),
                i = 0,
                len = $merge.length;
            for (; i < len; i++) {
                var cell = $merge[i],
                    arr = self.getCellIndx(cell);
                if (arr) {
                    var o_rip = arr[0],
                        o_ci = arr[1],
                        m = iMerge.getRootCell(o_rip + offset, o_ci),
                        v_rip = m.v_ri - offset,
                        $row = self.get$Row(v_rip),
                        ht = self.getHeightR(v_rip),
                        htCell = self.getHeightCellM(o_rip, m.o_rc),
                        top = self.getTop(v_rip);
                    setRowDims($row, ht, top);
                    style = cell.style;
                    style.height = htCell + "px";
                    if (!heightOnly) {
                        style.width = self.getWidthCellM(o_ci, m.o_cc) + "px";
                        style.left = self.getLeft(o_ci) + "px"
                    }
                }
            }
        },
        setRowDims: function() {
            var active = this.isBody() && this.that.Anim().isActive();
            return function($row, ht, top) {
                var obj = {
                    height: ht,
                    width: "100%"
                };
                if (!active) obj.top = top;
                $row.css(obj)
            }
        },
        setColWdArr: function(initH, finalH) {
            var ci = finalH,
                ri, self = this,
                jump = self.jump,
                CM = self.colModel,
                column, cell, rd, data = self.data,
                width, fr = self.freezeRows,
                maxWidth = this.maxHt + "px",
                wd, consider, iM = self.iMerge,
                m, initV = self.initV,
                isBody = self.isBody(),
                isSum = self.isSum(),
                takeColumnWidths = isBody || isSum,
                finalV = self.isHead() ? self.that.headerCells.length - 1 : self.finalV;
            if (finalV >= 0) {
                for (; ci >= initH; ci--) {
                    column = CM[ci];
                    if (!column.hidden && (column.width + "").indexOf("%") === -1) {
                        wd = takeColumnWidths ? column.width : column._minWidth;
                        if (wd) {
                            for (ri = 0; ri <= finalV; ri++) {
                                ri = jump(initV, fr, ri);
                                rd = data[ri];
                                if (rd && !rd.pq_hidden) {
                                    consider = true;
                                    if (m = iM.ismergedCell(ri, ci)) {
                                        if (m === true) {
                                            continue
                                        }
                                        m = iM.getRootCell(ri, ci);
                                        if (m.v_rc > 1 || m.v_cc > 1) {
                                            if (m.v_cc > 1) continue;
                                            consider = false
                                        }
                                        cell = self.getCell(m.o_ri, m.o_ci)
                                    } else {
                                        cell = self.getCell(ri, ci)
                                    }
                                    cell.parentNode.style.width = maxWidth;
                                    if (consider) {
                                        cell.style.width = "auto";
                                        var child = $(cell).find(".pq-menu-icon,.pq-menu-filter-icon");
                                        if (child.length) {
                                            child.css({
                                                position: "static",
                                                "float": "left",
                                                width: 20
                                            });
                                            var child2 = $(cell).find(".pq-td-div");
                                            child2.css("width", "auto")
                                        }
                                    }
                                    width = cell.offsetWidth + 1;
                                    if (consider && child.length) {
                                        child.css({
                                            position: "",
                                            "float": "",
                                            width: ""
                                        });
                                        child2.css("width", "")
                                    }
                                    wd = Math.max(width, wd)
                                }
                            }
                            if (!(wd > 0)) {
                                throw "wd NaN"
                            }
                            column.width = self.colwdArr[ci] = wd;
                            column._resized = true
                        }
                    }
                }
            }
        },
        setRowHtArr: function(initV, finalV, hChanged) {
            var rip = finalV,
                ci, _ci, self = this,
                changed, jump = self.jump,
                offset = self.riOffset,
                rowhtArr = self.rowhtArr,
                newht, data = self.data,
                CM = self.colModel,
                rd, cell, height, _m = self._m(),
                diffV = self.diffV,
                fc = self.freezeCols,
                rowHtMin = self.rowHt,
                ht, iM = self.iMerge,
                m, rc, rowHtDetail = self.rowHtDetail,
                htDetail, initH = self.initH,
                finalH = self.finalH;
            for (; rip >= initV; rip--) {
                rd = data[rip];
                if (rd && !rd.pq_hidden) {
                    htDetail = rowHtDetail ? self.getHtDetail(rd, rowHtDetail) : 0;
                    ht = hChanged ? rowhtArr[rip] - htDetail : rowHtMin;
                    for (ci = 0; ci <= finalH; ci++) {
                        _ci = ci, ci = jump(initH, fc, ci);
                        if (!CM[ci].hidden) {
                            if (m = _m && iM.ismergedCell(rip + offset, ci)) {
                                if (m === true || diffV) {
                                    continue
                                }
                                m = iM.getRootCell(rip + offset, ci);
                                cell = self.getCell(m.o_ri - offset, m.o_ci)
                            } else {
                                cell = self.getCell(rip, ci)
                            }
                            cell.style.height = "auto";
                            height = cell.offsetHeight;
                            if (m) {
                                rc = m.o_rc - (m.v_ri - m.o_ri) - 1;
                                height -= m.v_rc > 1 ? self.getHeightCellDirty(m.v_ri + 1, rc) : 0
                            }
                            ht = Math.max(height, ht)
                        }
                    }
                    newht = ht + htDetail;
                    if (rowhtArr[rip] !== newht) {
                        rowhtArr[rip] = rd.pq_ht = newht;
                        changed = true
                    }
                }
            }
            return changed
        },
        setTimer: function(uuid) {
            var timeID = {};
            return function(fn, id, interval) {
                id = uuid + id;
                clearTimeout(timeID[id]);
                var self = this;
                timeID[id] = setTimeout(function() {
                    self.that.element && fn.call(self)
                }, interval || 300)
            }
        }
    }, new pq.cVirtual)
})(jQuery);
(function($) {
    pq.cRenderBody = function(that, obj) {
        var self = this,
            uuid = self.uuid = that.uuid,
            o = that.options,
            $b = self.$ele = obj.$b,
            $sum = self.$sum = obj.$sum,
            $h = self.$h = obj.$h,
            prInterval = o.postRenderInterval;
        self.that = that;
        self.setTimer = self.setTimer(uuid);
        self.cellPrefix = "pq-body-cell-u" + uuid + "-";
        self.rowPrefix = "pq-body-row-u" + uuid + "-";
        self.cellCls = "pq-grid-cell";
        self.iMerge = that.iMerge;
        self.rowHt = o.rowHt || 27;
        self.rowHtDetail = o.detailModel.height;
        self.iRenderHead = that.iRenderHead = new pq.cRenderHead(that, $h);
        self.iRenderSum = that.iRenderSum = new pq.cRenderSum(that, $sum);
        that.on("headHtChanged", self.onHeadHtChanged(self));
        if (prInterval !== null) {
            that.on("refresh refreshRow refreshCell refreshColumn", function() {
                if (prInterval < 0) self.postRenderAll();
                else self.setTimer(self.postRenderAll, "postRender", prInterval)
            })
        }
        self.preInit($b);
        that.on("refresh softRefresh", self.onRefresh.bind(self))
    };
    pq.cRenderBody.prototype = $.extend({}, new $.paramquery.cGenerateView, new pq.cRender, {
        setHtCont: function(ht) {
            this.dims.htCont = ht;
            this.$ele.css("height", ht)
        },
        flex: function(ci) {
            var self = this,
                that = self.that;
            if (that._trigger("beforeFlex", null, {
                    colIndx: ci
                }) === false) {
                return
            }
            self.iRenderHead.autoWidth(ci);
            self.iRenderSum.autoWidth(ci);
            self.autoWidth(ci);
            that.refreshCM(null, {
                flex: true
            });
            that.refresh({
                source: "flex",
                soft: true
            })
        },
        init: function(obj) {
            obj = obj || {};
            var self = this,
                that = self.that,
                soft = obj.soft,
                normal = !soft,
                source = obj.source,
                iRH = self.iRenderHead,
                iRS = self.iRenderSum,
                o = that.options,
                SM = o.scrollModel,
                fc = self.freezeCols = o.freezeCols || 0,
                fr = self.freezeRows = o.freezeRows,
                numberCell = self.numberCell = o.numberCell,
                CM = self.colModel = that.colModel,
                width = self.width = o.width,
                height = self.height = o.height,
                $ele = self.$ele,
                data;
            if (normal) {
                self.dims = that.dims;
                self.autoFit = SM.autoFit;
                self.pauseTO = SM.timeout;
                data = that.pdata || [];
                $ele.find(".pq-grid-norows").css("display", data.length ? "none" : "");
                self.data = data;
                self.maxHt = pq.cVirtual.maxHt;
                self.riOffset = that.riOffset;
                self.cols = CM.length;
                self.rows = data.length;
                if (that._mergeCells) self._m = function() {
                    return true
                };
                self.autoRow = o.autoRow;
                self.initRowHtArrSuper();
                if (o.stripeRows) self.initStripeArr()
            }
            self.refreshColumnWidths();
            self.numColWd = iRH.numColWd = iRS.numColWd = numberCell.show ? numberCell.outerWidth : 0;
            self.initColWdArrSuper();
            iRS.init(obj);
            if (obj.header) iRH.init(obj);
            else self.setPanes();
            iRS.initPost(obj);
            obj.header && iRH.initPost(obj);
            if (self.$cright[0].scrollTop > self.getTop(self.rows)) {
                return
            }
            if (normal) {
                self.refreshAllCells({
                    source: source
                })
            } else if (soft) {
                self.setCellDims();
                self.refresh({
                    source: source
                });
                that._trigger("softRefresh")
            }
        },
        initColWdArr: function() {
            var CM = this.colModel,
                len = CM.length,
                column, leftArr = this.leftArr = this.iRenderHead.leftArr = this.iRenderSum.leftArr = [],
                i = 0,
                colwdArr = this.colwdArr = this.iRenderHead.colwdArr = this.iRenderSum.colwdArr = [];
            for (; i < len; i++) {
                column = CM[i];
                colwdArr[i] = column.hidden ? 0 : column.outerWidth
            }
        },
        initColWdArrSuper: function() {
            this.initColWdArr();
            this.setTopArr(0, true);
            this.assignTblDims(true)
        },
        inViewport: function(rip, ci, cell) {
            cell = cell || this.getCell(rip, ci);
            var dims = this.dims,
                left = dims.left - 2,
                right = dims.right - (dims.wdCont - dims.wdContClient) + 2,
                top = dims.top - 2,
                bottom = dims.bottom - (dims.htCont - dims.htContClient) + 2,
                region = this.getCellRegion(rip, ci),
                initH = this.initH,
                finalH = this.finalH,
                initV = this.initV,
                finalV = this.finalV,
                row = cell.parentNode,
                x1 = cell.offsetLeft - dims.wdContLeft,
                y1 = row.offsetTop - dims.htContTop,
                x2 = x1 + cell.offsetWidth,
                y2 = y1 + cell.offsetHeight;
            if (region === "right") {
                return x1 > left && x2 < right && y1 > top && y2 < bottom
            } else if (region === "tr") {
                return x1 > left && x2 < right
            } else if (region === "left") {
                return y1 > top && y2 < bottom
            } else {
                return true
            }
        },
        isBody: function() {
            return true
        },
        onHeadHtChanged: function(self) {
            return function(evt, ht) {
                self.setPanes()
            }
        },
        onMouseWheel: function(self) {
            var timeID;
            return function(evt) {
                var ele = this;
                ele.style["pointer-events"] = "none";
                clearTimeout(timeID);
                timeID = setTimeout(function() {
                    ele.style["pointer-events"] = ""
                }, 300)
            }
        },
        onNativeScroll: function(self) {
            return function() {
                var cr = self.$cright[0],
                    that = self.that,
                    sl = cr.scrollLeft,
                    st = cr.scrollTop;
                self.iRenderSum.setScrollLeft(sl);
                self.iRenderHead.setScrollLeft(sl);
                self.$cleft[0].scrollTop = st;
                self.$ctr[0].scrollLeft = sl;
                self.refresh();
                that._trigger("scroll");
                self.setTimer(function() {
                    that._trigger("scrollStop")
                }, "scrollStop", self.pauseTO)
            }
        },
        onRefresh: function(evt, ui) {
            if (ui.source !== "autoRow") this.initRefreshTimer(ui.hChanged)
        },
        onRefreshTimer: function(self, hChanged) {
            return function() {
                var cr = self.$cright[0];
                self.autoRow && self.autoHeight({
                    hChanged: hChanged
                });
                cr.scrollTop = cr.scrollTop;
                cr.scrollLeft = cr.scrollLeft
            }
        },
        pageDown: function(rip, fn) {
            var self = this,
                arr = self.topArr,
                prevTop = arr[rip],
                top, tmp = rip,
                dims = self.dims,
                stop = this.$cright[0].scrollTop,
                diff = (dims.htContClient - dims.htContTop) * 95 / 100,
                reqTop = prevTop + diff,
                i = rip,
                len = arr.length - 1;
            self.scrollY(stop + diff, function() {
                i = rip < self.initV ? self.initV : rip;
                for (; i <= len; i++) {
                    top = arr[i];
                    if (top > prevTop) {
                        prevTop = top;
                        tmp = i - 1
                    }
                    if (top > reqTop) {
                        tmp = i - 1;
                        break
                    }
                }
                fn(tmp)
            })
        },
        pageUp: function(rip, fn) {
            var self = this,
                arr = self.topArr,
                prevTop = arr[rip],
                top, stop = this.$cright[0].scrollTop,
                dims = self.dims,
                diff = (dims.htContClient - dims.htContTop) * 80 / 100,
                reqTop = prevTop - diff,
                tmp = rip,
                i = rip;
            for (; i >= 0; i--) {
                top = arr[i];
                if (top < prevTop) {
                    prevTop = top;
                    tmp = i
                }
                if (top < reqTop) {
                    tmp = i;
                    break
                }
            }
            self.scrollY(stop - diff, function() {
                fn(tmp)
            })
        },
        postRenderAll: function() {
            var self = this,
                grid = self.that,
                offset = self.riOffset,
                cell, ui, iM = self.iMerge,
                data = self.data,
                CM = self.colModel,
                postRender;
            self.eachH(function(column, ci) {
                if (postRender = column.postRender) {
                    self.eachV(function(rd, rip) {
                        ui = iM.getRootCellO(rip + offset, ci, true);
                        cell = self.getCell(ui.rowIndxPage, ui.colIndx);
                        if (cell && !cell._postRender) {
                            ui.cell = cell;
                            grid.callFn(postRender, ui);
                            cell._postRender = true
                        }
                    })
                }
            });
            if (postRender = self.numberCell.postRender) {
                self.eachV(function(rd, rip) {
                    var cell = self.getCell(rip, -1),
                        ri = rip + offset,
                        ui = {
                            rowIndxPage: rip,
                            colIndx: -1,
                            rowIndx: ri,
                            rowData: data[ri]
                        };
                    if (cell && !cell._postRender) {
                        ui.cell = cell;
                        grid.callFn(postRender, ui);
                        cell._postRender = true
                    }
                })
            }
        },
        refreshRow: function(ri) {
            var self = this,
                initH = self.initH,
                finalH = self.finalH,
                fc = self.freezeCols,
                $rows = self.get$Row(ri),
                c1, c2, regions = [];
            $rows.each(function(i, row) {
                var arr = self.getRowIndx(row);
                regions.push(arr[1])
            });
            self.that._trigger("beforeViewEmpty", null, {
                rowIndxPage: ri
            });
            $rows.remove();
            regions.forEach(function(region) {
                if (region === "left" || region === "lt") {
                    c1 = 0;
                    c2 = fc - 1
                } else {
                    c1 = initH;
                    c2 = finalH
                }
                self.renderView(ri, ri, c1, c2, region)
            })
        },
        _scrollRow: function(rip, left) {
            var self = this,
                dims = self.dims,
                htContClient = dims[left ? "wdContClient" : "htContClient"],
                newScrollTop, scrollTopStr = left ? "scrollLeft" : "scrollTop",
                cr = self.$cright[0],
                data_len = self[left ? "colModel" : "data"].length,
                fr = self[left ? "freezeCols" : "freezeRows"],
                scrollTop = cr[scrollTopStr],
                htContTop = dims[left ? "wdContLeft" : "htContTop"];
            if (rip < fr || rip > data_len - 1) {
                return scrollTop
            }
            var top = self.getTopSafe(rip, left),
                htCell = self[left ? "getWidthCell" : "getHeightR"](rip);
            if (top !== null) {
                if (top + htCell + 1 > scrollTop + htContClient) {
                    newScrollTop = top + htCell + 1 - htContClient
                } else if (top < scrollTop + htContTop) {
                    newScrollTop = top - htContTop;
                    newScrollTop = newScrollTop < 0 ? 0 : newScrollTop
                }
                return newScrollTop >= 0 ? newScrollTop : scrollTop
            }
        },
        scrollColumn: function(ci, fn) {
            var x = this._scrollRow(ci, true);
            this.scrollX(x, fn)
        },
        scrollRow: function(rip, fn) {
            var y = this._scrollRow(rip);
            this.scrollY(y, fn)
        },
        scrollCell: function(rip, ci, fn) {
            var y = this._scrollRow(rip),
                x = this._scrollRow(ci, true);
            this.scrollXY(x, y, fn)
        },
        scrollY: function(y, fn) {
            var c = this.$cright[0];
            if (y !== null) {
                y = y >= 0 ? y : 0;
                this.scrollXY(c.scrollLeft, y, fn)
            } else return c.scrollTop
        },
        scrollXY: function(x, y, fn) {
            var c = this.$cright[0],
                that = this.that,
                oldX = c.scrollLeft,
                oldY = c.scrollTop,
                newX, newY;
            if (x >= 0) {
                c.scrollLeft = x;
                c.scrollTop = y;
                newX = c.scrollLeft;
                newY = c.scrollTop;
                if (fn) {
                    if (newX === oldX && newY === oldY) fn();
                    else that.one("scroll", function() {
                        if (newX === oldX) fn();
                        else that.one("scrollHead", fn)
                    })
                }
            } else return [oldX, oldY]
        },
        getSBHt: function(wdTbl) {
            var dims = this.dims,
                o = this.that.options,
                sbDim = pq.cVirtual.SBDIM;
            if (this.autoFit) {
                return 0
            } else if (this.width === "flex" && !o.maxWidth) {
                return 0
            } else if (wdTbl > dims.wdCenter + sbDim) {
                return sbDim
            } else {
                return 0
            }
        },
        getSBWd: function() {
            var dims = this.dims;
            if (!dims.htCenter) {
                return 0
            } else {
                return pq.cVirtual.SBDIM
            }
        },
        setPanes: function() {
            var self = this,
                that = self.that,
                o = that.options,
                autoFit = self.autoFit,
                dims = self.dims,
                htBody = dims.htCenter - dims.htHead - dims.htSum,
                wdBody = dims.wdCenter,
                $ele = self.$ele,
                fc = self.freezeCols,
                fr = self.freezeRows,
                $cr = self.$cright,
                cr = $cr[0],
                $cl = self.$cleft,
                $clt = self.$clt,
                $ctr = self.$ctr,
                wdLeftPane = self.getLeft(fc),
                sbDim = pq.cVirtual.SBDIM,
                flexWd = dims.wdTbl,
                flexHt = Math.max(dims.htTbl, 30) + self.getSBHt(flexWd),
                clientWidth, offsetWidth, clientHeight, htTopPane = self.getTopSafe(fr);
            $ctr.css("display", fr ? "" : "none");
            $cl.css("display", wdLeftPane ? "" : "none");
            $clt.css("display", wdLeftPane && fr ? "" : "none");
            $cr.css("overflow-y", "");
            if (self.height === "flex") {
                if (htBody > 0 && flexHt > htBody) {
                    flexHt = Math.min(flexHt, htBody)
                } else {
                    $cr.css("overflow-y", "hidden")
                }
                self.setHtCont(flexHt)
            } else {
                self.setHtCont(htBody)
            }
            if (autoFit && self.getSBWd()) {
                $cr.css("overflow-y", "scroll")
            }
            $cr.css("overflow-x", autoFit ? "hidden" : "");
            if (self.width === "flex") {
                flexWd = parseInt($ele[0].style.height) >= dims.htTbl - 1 ? flexWd : flexWd + sbDim;
                if (o.maxWidth && flexWd > wdBody) {
                    flexWd = Math.min(flexWd, wdBody)
                } else {
                    $cr.css("overflow-x", "hidden")
                }
                self._flexWidth = flexWd;
                $ele.width(self._flexWidth)
            } else {
                $ele.css("width", "")
            }
            self.htCont = dims.htCont = $cr.height();
            self.wdCont = dims.wdCont = $cr.width();
            dims.htContClient = clientHeight = cr.clientHeight;
            dims.wdContClient = clientWidth = cr.clientWidth;
            if (wdLeftPane > clientWidth) {
                $cr.css("overflow-x", "hidden");
                wdLeftPane = clientWidth
            }
            $cl.css("width", wdLeftPane);
            $clt.css("width", wdLeftPane);
            $ctr.width(clientWidth);
            $cl.height(clientHeight);
            offsetWidth = cr.offsetWidth;
            self.iRenderHead.setWidth(offsetWidth, clientWidth);
            self.iRenderSum.setWidth(offsetWidth, clientWidth);
            if (htTopPane > clientHeight) {
                $cr.css("overflow-y", "hidden");
                htTopPane = clientHeight
            }
            $clt.css("height", htTopPane);
            $ctr.css("height", htTopPane);
            self.wdContLeft = dims.wdContLeft = $cl.width();
            self.htContTop = dims.htContTop = $ctr.height()
        }
    }, new pq.cVirtual)
})(jQuery);
(function($) {
    function cMerge(that) {
        this.that = that
    }
    $.paramquery.cMergeHead = cMerge;
    cMerge.prototype = {
        getRootCell: function(ri, ci) {
            var that = this.that,
                hc = that.headerCells,
                column = hc[ri][ci],
                rc = column.rowSpan,
                o_ci = column.leftPos;
            while (ri) {
                if (hc[ri - 1][o_ci] !== column) {
                    break
                } else {
                    ri--
                }
            }
            return {
                v_ri: ri,
                o_ri: ri,
                v_ci: that.getNextVisibleCI(o_ci),
                o_ci: o_ci,
                v_rc: rc,
                o_rc: rc,
                v_cc: column.colSpan,
                o_cc: column.o_colspan
            }
        },
        ismergedCell: function(ri, ci) {
            var that = this.that,
                hc = that.headerCells,
                row = hc[ri],
                column = row ? row[ci] : "",
                o_ci, rc, v_cc, v_ci;
            if (column) {
                o_ci = column.leftPos;
                if ((ri === 0 || hc[ri - 1][ci] !== column) && (v_ci = that.getNextVisibleCI(o_ci)) === ci) {
                    rc = column.rowSpan;
                    v_cc = column.colSpan;
                    if (rc && v_cc && (rc > 1 || v_cc > 1)) {
                        return {
                            o_ri: ri,
                            o_ci: o_ci,
                            v_rc: rc,
                            o_rc: rc,
                            v_cc: v_cc,
                            o_cc: column.o_colspan
                        }
                    }
                } else if (column.colSpan) {
                    return true
                }
            }
        },
        getClsStyle: function() {
            return {}
        }
    }
})(jQuery);
(function($) {
    pq.cRenderHS = $.extend({}, new pq.cRender, {
        init: function(obj) {
            obj = obj || {};
            var self = this,
                that = self.that,
                o = that.options,
                fc = self.freezeCols = o.freezeCols || 0,
                numberCell = self.numberCell = o.numberCell,
                CM = self.colModel = that.colModel,
                isHead = self.isHead(),
                isSum = self.isSum(),
                autoRow = isHead ? o.autoRowHead : o.autoRowSum,
                width = self.width = o.width,
                height = self.height = "flex",
                headerCells = that.headerCells,
                data, fr = self.freezeRows = 0;
            self.dims = that.dims;
            if (isHead) {
                data = self.data = o.showHeader ? o.filterModel.header ? headerCells.concat([
                    []
                ]) : headerCells : []
            } else if (isSum) {
                data = self.data = o.summaryData || []
            }
            self.maxHt = pq.cVirtual.maxHt;
            self.riOffset = 0;
            self.cols = CM.length;
            self.rows = data.length;
            if (isHead) {
                if (headerCells.length > 1) self._m = function() {
                    return true
                }
            } else {
                if (o.stripeRows) self.initStripeArr()
            }
            self.autoRow = autoRow === null ? o.autoRow : autoRow;
            self.initRowHtArrSuper();
            self.assignTblDims(true);
            self.setPanes()
        },
        initPost: function(obj) {
            obj = obj || {};
            var self = this,
                autoRow = self.autoRow;
            if (self.data.length) {
                if (obj.soft) {
                    self.setCellDims();
                    self.refresh()
                } else {
                    self.refreshAllCells()
                }
            }
        },
        onNativeScroll: function(self) {
            return function() {
                self.refresh();
                self.isHead() && self.that._trigger("scrollHead")
            }
        },
        onRefresh: function(evt, ui) {
            this.initRefreshTimer(ui.hChanged)
        },
        refreshHS: function() {
            this.init();
            this.initPost()
        },
        setPanes: function() {
            var self = this,
                that = self.that,
                dims = self.dims,
                $ele = self.$ele,
                fc = self.freezeCols,
                $cr = self.$cright,
                cr = $cr[0],
                $cl = self.$cleft,
                wdLeftPane = self.getLeft(fc),
                isHead = self.isHead(),
                isSum = self.isSum(),
                flexHt = self.getTopSafe(self.rows),
                data_len = self.data.length;
            $cl.css("display", wdLeftPane ? "" : "none");
            $ele.height(flexHt);
            if (isHead) {
                dims.htHead = flexHt;
                that._trigger("headHtChanged")
            } else if (isSum) {
                dims.htSum = flexHt;
                that._trigger("headHtChanged")
            }
            self.htCont = $cr.height();
            self.wdCont = $cr.width();
            $cl.css("width", wdLeftPane);
            $cl.height(cr.clientHeight);
            self.wdContLeft = $cl.width();
            self.htContTop = 0
        },
        setScrollLeft: function(sl) {
            var $cr = this.$cright;
            if ($cr && this.scrollLeft !== sl) this.scrollLeft = $cr[0].scrollLeft = sl
        },
        setWidth: function(offsetWidth, clientWidth) {
            this.$ele[0].style.width = offsetWidth + "px";
            this.$spacer.width(offsetWidth - clientWidth)
        }
    })
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    var cRenderHead = pq.cRenderHead = function(that, $h) {
        this.that = that;
        var o = that.options,
            self = this,
            uuid = self.uuid = that.uuid;
        self.iMerge = new _pq.cMergeHead(that);
        self.$ele = $h;
        self.height = "flex";
        self.scrollTop = 0;
        self.rowHt = o.rowHtHead || 28;
        self.cellCls = "pq-grid-col";
        self.setTimer = self.setTimer(uuid);
        self.cellPrefix = "pq-head-cell-u" + uuid + "-";
        self.rowPrefix = "pq-head-row-u" + uuid + "-";
        self.preInit($h);
        $h.on("click", function(evt) {
            return self.onHeaderClick(evt)
        });
        that.on("headerKeyDown", self.onHeaderKeyDown.bind(self)).on("refreshHeader softRefresh", self.onRefresh.bind(self))
    };
    cRenderHead.prototype = $.extend({}, pq.cRenderHS, new _pq.cHeader, new _pq.cHeaderSearch, {
        getRowClsStyleAttr: function(ri) {
            var len = this.that.headerCells.length,
                cls = "";
            if (len === ri) cls = "pq-grid-header-search-row";
            else if (ri === len - 1) cls = "pq-grid-title-row";
            return [cls, "", ""]
        },
        getTblCls: function(o) {
            var cls = "pq-grid-header-table";
            return o.hwrap ? cls : cls + " pq-no-wrap"
        },
        isHead: function() {
            return true
        },
        onRefreshTimer: function(self, initHChanged) {
            return function() {
                var cr = self.$cright[0];
                self.autoRow && self.autoHeight({
                    timer: false,
                    hChanged: initHChanged
                });
                cr.scrollTop = 0;
                cr.scrollLeft = cr.scrollLeft;
                self.onCreateHeader();
                self.refreshResizeColumn();
                self.refreshHeaderSortIcons();
                self.that._trigger("refreshHeadAsync")
            }
        },
        _resizeId: function(ci) {
            return "pq-resize-div-" + this.uuid + "-" + ci
        },
        _resizeCls: function() {
            return "pq-resize-div-" + this.uuid
        },
        _resizeDiv: function(ci) {
            return this.getById(this._resizeId(ci))
        },
        refreshResizeColumn: function() {
            var initH = this.initH,
                CM = this.colModel,
                column, resizeCls = this._resizeCls(),
                finalH = this.finalH,
                numberCell = this.numberCell,
                fc = this.freezeCols,
                buffer1 = [],
                buffer2 = [],
                buffer, lftCol, lft, id, ci = numberCell.show ? -1 : 0;
            this.$ele.find("." + resizeCls).remove();
            for (; ci <= finalH; ci++) {
                if (ci >= initH) {
                    buffer = buffer2
                } else if (ci < fc) {
                    buffer = buffer1
                } else {
                    continue
                }
                column = ci >= 0 ? CM[ci] : numberCell;
                if (!column.hidden && column.resizable !== false && !this._resizeDiv(ci)) {
                    lftCol = this.getLeft(ci + 1);
                    lft = lftCol - 5;
                    id = this._resizeId(ci);
                    buffer.push("<div id='", id, "' pq-col-indx='", ci, "' style='left:", lft, "px;'", " class='pq-grid-col-resize-handle " + resizeCls + "'>&nbsp;</div>")
                }
            }
            buffer1.length && this.$cleft.append(buffer1.join(""));
            buffer2.length && this.$cright.append(buffer2.join(""))
        },
        renderCell: function(ui) {
            var rd = ui.rowData,
                ri = ui.rowIndx,
                ci = ui.colIndx,
                attr = ui.attr,
                cls = ui.cls,
                style = ui.style,
                column = rd[ci],
                val;
            if (column) {
                return this.createHeaderCell(ri, ci, column, attr, cls, style)
            } else {
                val = this.renderFilterCell(ui.column, ci, cls);
                return "<div " + attr + " class='" + cls.join(" ") + "' style='" + style.join("") + "'>" + val + "</div>"
            }
        }
    })
})(jQuery);
(function($) {
    var _pq = $.paramquery;
    var cRenderSum = pq.cRenderSum = function(that, $bottom) {
        var o = that.options,
            self = this,
            uuid = self.uuid = that.uuid;
        self.that = that;
        self.iMerge = {
            ismergedCell: function() {}
        };
        self.$ele = $bottom;
        self.height = "flex";
        self.scrollTop = 0;
        self.rowHt = o.rowHtSum || 27;
        self.cellCls = "pq-grid-cell";
        self.setTimer = self.setTimer(uuid);
        self.cellPrefix = "pq-sum-cell-u" + uuid + "-";
        self.rowPrefix = "pq-sum-row-u" + uuid + "-";
        self.preInit($bottom);
        that.on("refreshSum softRefresh", self.onRefresh.bind(self))
    };
    cRenderSum.prototype = $.extend({}, new _pq.cGenerateView, pq.cRenderHS, {
        isSum: function() {
            return true
        },
        onRefreshTimer: function(self, initHChanged) {
            return function() {
                var cr = self.$cright[0];
                self.autoRow && self.autoHeight({
                    timer: false,
                    hChanged: initHChanged
                });
                cr.scrollTop = 0;
                cr.scrollLeft = cr.scrollLeft
            }
        }
    })
})(jQuery);