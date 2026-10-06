export const PAGE_ROUTES = {
  "/conversations/consult": "/conversations/consult-by-sid",
  "/conversations/fetch-by-participant": "/conversations/search-by-number",
  "/conversations/close": "/conversations/close-by-number",
  "/taskrouter/workers": "/taskrouter/manage-workers",
  "/taskrouter/search-tasks": "/taskrouter/search-tasks-by-sid-or-number",
  "/taskrouter/create-workflow": "/taskrouter/create-workflow-from-csv",
  "/taskrouter/add-particular-filter": "/taskrouter/add-business-rule-filter",
  "/taskrouter/cancel-queue-tasks":
    "/taskrouter/cancel-queue-tasks-and-close-conversations",
  "/numbers/list": "/numbers/list-messaging-numbers",
  "/flex/create-address-config": "/flex/create-conversation-address",
  "/settings/environments": "/settings/manage-environments",
  "/settings/contacts": "/settings/manage-contacts",
  "/settings/variables": "/settings/manage-variables",
  "/conversations/fetch": "/conversations/consult-by-sid?tab=details",
  "/conversations/history": "/conversations/consult-by-sid?tab=messages",
  "/taskrouter/fetch-task": "/taskrouter/search-tasks-by-sid-or-number",
  "/taskrouter/fetch-worker": "/taskrouter/manage-workers?tab=details",
  "/taskrouter/assign-workers": "/taskrouter/manage-workers?tab=skills",
  "/taskrouter/update-worker-feature":
    "/taskrouter/manage-workers?tab=features",
}

export const API_ROUTES = {
  "/api/conversations/fetch": "/api/conversations/get-details-by-sid",
  "/api/conversations/history": "/api/conversations/get-messages-by-sid",
  "/api/conversations/fetch-by-participant":
    "/api/conversations/search-by-number",
  "/api/conversations/close": "/api/conversations/close-by-number",
  "/api/conversations/close-single": "/api/conversations/close-by-sid",
  "/api/taskrouter/fetch-worker": "/api/taskrouter/get-worker-details",
  "/api/taskrouter/assign-workers": "/api/taskrouter/add-skill-to-workers",
  "/api/taskrouter/update-worker-feature":
    "/api/taskrouter/set-worker-feature-status",
  "/api/taskrouter/fetch-task": "/api/taskrouter/get-task-by-sid",
  "/api/taskrouter/search-tasks": "/api/taskrouter/search-tasks-by-number",
  "/api/taskrouter/create-workflow": "/api/taskrouter/create-workflow-from-csv",
  "/api/taskrouter/add-particular-filter":
    "/api/taskrouter/add-business-rule-filter",
  "/api/taskrouter/cancel-queue-tasks":
    "/api/taskrouter/cancel-queue-tasks-and-close-conversations",
  "/api/numbers/list": "/api/numbers/list-messaging-numbers",
  "/api/flex/create-address-config": "/api/flex/create-conversation-address",
  "/api/environments/verify": "/api/environments/verify-twilio-credentials",
}
