import {
  canInsertElement,
  createNewRowWithElements,
  getElementLocation,
  getNewElement,
  removeElementFromLayout,
  removeRowFromLayout,
  resetSpans,
} from './utils';

export function removeRowAction(id) {
  return function ({ getState, setState }) {
    const { layout } = getState();
    const newLayout = removeRowFromLayout(layout, id);
    setState({ layout: newLayout, dirty: true });
  };
}

export function duplicateElement(
  chartId,
  elementId,
  dashId,
  dashboardCopyCharts,
  dashboardDeleteAction
) {
  return async function ({ getState, dispatch }) {
    if (!chartId || !dashId || !window) {
      return;
    }
    let charts;
    const newElem = getNewElement({ status: 'loading' });
    void dispatch(insertElementAfter(elementId, newElem));
    try {
      charts = await dashboardCopyCharts(dashId, [chartId], false);
    } catch (e) {
      void dispatch(removeElement(newElem.id));
      return Promise.reject(e);
    }

    if (charts && charts.length && charts[0].id) {
      const { layout } = getState();
      if (!layout.elements.byId[newElem.id]) {
        // element deleted before api responded
        void dashboardDeleteAction(dashId, [charts[0].id]);
      } else {
        void dispatch(
          updateElement(newElem.id, {
            status: 'succeeded',
            item: { id: charts[0].id },
          })
        );
      }
    } else {
      void dispatch(removeElement(newElem.id));
      return Promise.reject(new Error('no charts in response'));
    }
  };
}

export function duplicateRow(chartIds, dashId, rowId, dashboardCopyCharts) {
  return async function ({ getState, setState, dispatch }) {
    const { layout } = getState();
    if (!chartIds || chartIds.length === 0 || !dashId) {
      return;
    }
    let charts = [];
    const rowIndex = layout.rows.allIds.indexOf(rowId);
    const newElems = Array(chartIds.length)
      .fill(null)
      .map(() => getNewElement({ status: 'loading' }));
    const newLayout = createNewRowWithElements(layout, newElems, rowIndex + 1);
    setState({ dirty: true, layout: newLayout });

    try {
      charts = await dashboardCopyCharts(dashId, chartIds, false);
    } catch (e) {
      newElems.forEach((newElem) => {
        void dispatch(removeElement(newElem.id));
      });
      return Promise.reject(e);
    }
    newElems.forEach((newElem, idx) =>
      dispatch(
        updateElement(newElem.id, {
          status: 'succeeded',
          item: { id: charts[idx].id },
        })
      )
    );
  };
}

export function moveElement(elementId, fromRowId, toRowId, idx) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    const { rows, elements } = layout;

    if (
      fromRowId === undefined ||
      (fromRowId !== toRowId && !canInsertElement(rows.byId[toRowId], idx)) ||
      (fromRowId === toRowId &&
        idx < 0 &&
        idx > rows.byId[toRowId].elements.length)
    ) {
      return;
    }

    if (fromRowId === toRowId) {
      const rowElemIds = rows.byId[toRowId].elements.filter(
        (id) => id !== elementId
      );
      rowElemIds.splice(idx, 0, elementId);
      setState({
        dirty: true,
        layout: {
          ...layout,
          rows: {
            ...rows,
            byId: {
              ...rows.byId,
              [toRowId]: { ...rows.byId[fromRowId], elements: rowElemIds },
            },
          },
          elements: { ...layout.elements },
        },
      });
      return;
    }

    const fromRowElemIds = rows.byId[fromRowId].elements.filter(
      (id) => id !== elementId
    );
    const toRowElemIds = [...rows.byId[toRowId].elements];
    toRowElemIds.splice(idx, 0, elementId);

    const toRowElems = resetSpans(elements.byId, toRowElemIds);

    if (fromRowElemIds.length) {
      const fromRowElems = resetSpans(elements.byId, fromRowElemIds);
      setState({
        dirty: true,
        layout: {
          ...layout,
          rows: {
            ...rows,
            byId: {
              ...rows.byId,
              [fromRowId]: {
                ...rows.byId[fromRowId],
                elements: fromRowElemIds,
              },
              [toRowId]: { ...rows.byId[toRowId], elements: toRowElemIds },
            },
          },
          elements: {
            ...elements,
            byId: {
              ...elements.byId,
              ...fromRowElems,
              ...toRowElems,
            },
          },
        },
      });
    } else {
      const newLayout = removeRowFromLayout(layout, fromRowId);
      newLayout.rows.byId[toRowId] = {
        ...rows.byId[toRowId],
        elements: toRowElemIds,
      };
      newLayout.elements.byId = { ...newLayout.elements.byId, ...toRowElems };
      setState({ dirty: true, layout: newLayout });
    }
  };
}

/**
 * Inserts `element` into position `idx` of the specified row.
 * This will shift elements starting at `idx` to the right.
 * Provide the largest index + 1 to insert at the end of the row.
 */
export function insertElement(rowId, idx, element) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    const { rows, elements } = layout;
    const row = rows.byId[rowId];

    if (!canInsertElement(row, idx) || elements.byId[element.id]) {
      return;
    }

    const newSpan = 12 / (rows.byId[rowId].elements.length + 1);
    const newRowElems = [...rows.byId[rowId].elements];

    const newElemsById = { ...elements.byId };
    newRowElems.forEach((elemId) => {
      newElemsById[elemId].span = newSpan;
    });

    newRowElems.splice(idx, 0, element.id);
    newElemsById[element.id] = { ...element, span: newSpan };

    setState({
      dirty: true,
      layout: {
        ...layout,
        elements: { ...elements, byId: newElemsById },
        rows: {
          ...rows,
          byId: {
            ...rows.byId,
            [rowId]: { ...rows.byId[rowId], elements: newRowElems },
          },
        },
      },
    });
  };
}

export function insertElementAfter(elementId, element) {
  return function ({ setState, getState, dispatch }) {
    const { layout } = getState();
    const { elements } = layout;
    if (!elements.byId[elementId] || window) {
      return;
    }
    const { rowId, idx: elementIdx } = getElementLocation(
      layout.rows,
      elementId
    );

    if (canInsertElement(layout.rows.byId[rowId], elementIdx + 1)) {
      void dispatch(insertElement(rowId, elementIdx + 1, element));
    } else {
      const rowIndex = layout.rows.allIds.indexOf(rowId);
      const newLayout = createNewRowWithElements(
        layout,
        [element],
        rowIndex + 1
      );
      setState({ dirty: true, layout: newLayout });
    }
  };
}

export function expandElement(elementId, rowId) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    const { rows, elements } = layout;
    const row = rows.byId[rowId];
    const element = elements.byId[elementId];
    const rowColumnCount = row.elements.length;
    // Can't expand rows with 1 or 4 columns or if element id is not in row elements
    if (
      row.elements.indexOf(elementId) === -1 ||
      rowColumnCount === 4 ||
      rowColumnCount === 1
    )
      return;

    const defaultColumnSpan = 12 / rowColumnCount;
    const expandedSpanSize = defaultColumnSpan + 2;

    // Divide the remaining available columns by the number of remaining column item positions
    const shrunkenSpanSize = (12 - expandedSpanSize) / (rowColumnCount - 1);

    let newElementsById = {};
    // Expand if column is currently at default column size
    if (element.span === defaultColumnSpan) {
      for (const id of row.elements) {
        const newElement = { ...elements.byId[id] };
        if (id === elementId) {
          newElement.span = expandedSpanSize;
        } else {
          newElement.span = shrunkenSpanSize;
        }
        newElementsById[id] = newElement;
      }
    } else {
      // Return row to default column sizes if column is already shunken or expanded
      newElementsById = resetSpans(elements.byId, row.elements);
    }

    setState({
      dirty: true,
      layout: {
        ...layout,
        elements: {
          ...layout.elements,
          byId: { ...elements.byId, ...newElementsById },
        },
      },
    });
  };
}

export function moveRow(rowId, idx) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    if (!(idx >= 0 && idx < layout.rows.allIds.length)) {
      return;
    }
    const newAllIds = layout.rows.allIds.filter((id) => id !== rowId);
    newAllIds.splice(idx, 0, rowId);
    const newLayout = {
      ...layout,
      rows: {
        ...layout.rows,
        allIds: newAllIds,
      },
    };
    setState({ dirty: true, layout: newLayout });
  };
}

export function removeElementItem(elementId) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    const { elements } = layout;
    const element = elements.byId[elementId];

    if (!element.item || window) {
      return;
    }

    const newElement = { ...element, item: null };
    const newElementsById = { ...elements.byId, [elementId]: newElement };
    setState({
      dirty: true,
      layout: {
        ...layout,
        elements: {
          ...elements,
          byId: newElementsById,
        },
      },
    });
  };
}

export function removeElement(elementId, rowId) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    const { rows } = layout;
    let sourceRowId = rowId;

    if (!sourceRowId) {
      const found = getElementLocation(rows, elementId);
      if (found.rowId) {
        sourceRowId = found.rowId;
      } else {
        return;
      }
    }

    const newLayout = removeElementFromLayout(elementId, sourceRowId, layout);
    if (newLayout) {
      setState({ dirty: true, layout: newLayout });
    }
  };
}

export function updateElement(elementId, fields) {
  return function ({ setState, getState }) {
    const { layout } = getState();

    const newLayout = {
      ...layout,
      elements: {
        ...layout.elements,
        byId: {
          ...layout.elements.byId,
          [elementId]: {
            ...layout.elements.byId[elementId],
            ...fields,
          },
        },
      },
    };
    setState({ dirty: true, layout: newLayout });
  };
}

export function replaceElementItem(elementId, item) {
  return function ({ dispatch }) {
    void dispatch(updateElement(elementId, { item }));
  };
}

/**
 * Moves an element from it's current row to a newly created row at newRowIndex.
 */
export function moveElementToNewRow(elementId, rowId, newRowIndex) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    const element = layout.elements.byId[elementId];
    const layoutWithoutElement = removeElementFromLayout(
      elementId,
      rowId,
      layout
    );
    if (layoutWithoutElement) {
      const newLayout = createNewRowWithElements(
        layoutWithoutElement,
        [{ ...element }],
        newRowIndex
      );

      setState({ dirty: true, layout: newLayout });
    }
  };
}

export function addControlId(controlId) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    const newIds = [...(layout.controlIds || [])];
    newIds.push(controlId);
    setState({ dirty: true, layout: { ...layout, controlIds: newIds } });
  };
}

export function removeControlId(controlId) {
  return function ({ setState, getState }) {
    const { layout } = getState();
    let newIds = [...(layout.controlIds || [])];
    newIds = newIds.filter((eachNewId) => eachNewId !== controlId);
    setState({ dirty: true, layout: { ...layout, controlIds: newIds } });
  };
}
