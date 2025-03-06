/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/runtime'],
    function(record, search, runtime) {
        function doGet(requestParams) {
            try {
                // Get projects the employee has access to
                const projectSearch = search.create({
                    type: search.Type.JOB,
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['allowtime', 'is', 'T']
                    ],
                    columns: [
                        'entityid',
                        'companyname',
                        'customer'
                    ]
                });

                const projects = [];
                projectSearch.run().each(function(result) {
                    projects.push({
                        id: result.id,
                        name: result.getValue('entityid'),
                        customer: result.getValue('customer')
                    });
                    return true;
                });

                return {
                    success: true,
                    projects: projects
                };
            } catch (error) {
                log.error('GET Error', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        function doPost(requestBody) {
            try {
                const timeEntry = record.create({
                    type: record.Type.TIME_BILL,
                    isDynamic: true
                });

                // Set mandatory fields
                timeEntry.setValue({
                    fieldId: 'employee',
                    value: runtime.getCurrentUser().id
                });

                timeEntry.setValue({
                    fieldId: 'customer',
                    value: requestBody.customer
                });

                timeEntry.setValue({
                    fieldId: 'job', // project
                    value: requestBody.project
                });

                timeEntry.setValue({
                    fieldId: 'hours',
                    value: requestBody.hours
                });

                timeEntry.setValue({
                    fieldId: 'memo',
                    value: requestBody.description
                });

                // Parse and set date
                const date = new Date(requestBody.date);
                timeEntry.setValue({
                    fieldId: 'trandate',
                    value: date
                });

                // Save the record
                const recordId = timeEntry.save();

                return {
                    success: true,
                    id: recordId
                };
            } catch (error) {
                log.error('POST Error', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        }

        return {
            get: doGet,
            post: doPost
        };
    }); 