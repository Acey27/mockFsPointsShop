import React, { useState } from "react";

const EmployeeServicesCenter = () => {
  const [tab, setTab] = useState("tickets");

  return (
    <div className="flex flex-col md:flex-row gap-8 py-10">
      {/* Left Panel */}
      <div className="bg-white rounded-lg shadow p-6 w-full md:w-1/3">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Employee Services Center</h2>
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === "tickets"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-orange-600"
            }`}
            onClick={() => setTab("tickets")}
          >
            Employee Tickets
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition ${
              tab === "suggestion"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-orange-600"
            }`}
            onClick={() => setTab("suggestion")}
          >
            Suggestion Box
          </button>
        </div>
        {/* Tab Content */}
        {tab === "tickets" && (
          <form className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Dispute type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1">
                  <input type="radio" name="dispute" /> Attendance
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" name="dispute" /> Payroll
                </label>
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Date to dispute</label>
              <input type="date" className="border rounded px-2 py-1 w-full" />
            </div>
            <div>
              <label className="block font-medium mb-1">Subject</label>
              <input
                type="text"
                className="border rounded px-2 py-1 w-full"
                placeholder="Type your request here..."
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Reason</label>
              <textarea
                className="border rounded px-2 py-1 w-full"
                placeholder="Elaborate your concern"
              />
            </div>
            <button
              type="submit"
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 flex items-center gap-2 ml-auto"
              style={{ minWidth: 80 }}
            >
              <span>&gt;</span> Send
            </button>
          </form>
        )}
        {tab === "suggestion" && (
          <div className="text-gray-500 py-8 text-center">Coming soon...</div>
        )}
      </div>
      {/* Right Panel */}
      <div className="flex-1 flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Pending Disputes</h2>
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <img
              src="https://undraw.co/api/illustrations/undraw_no_data_re_kwbl.svg"
              alt="No pending disputes"
              className="w-32 mb-2"
            />
            <span>No pending disputes.</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">History</h2>
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <span className="text-3xl mb-2">⏳</span>
            <span>No recent disputes.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeServicesCenter;