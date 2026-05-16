{/* Assignment Examples */}
<div className="mb-6 p-4 bg-gray-50 rounded-lg">
<h4 className="font-medium text-gray-900 mb-2">Assignment Examples:</h4>
<div className="text-sm text-gray-600 space-y-1">
  <div>• IT subcommittee: 60%, HR subcommittee: 40%</div>
  <div>• Finance: 40%, Legal: 35%, Admin: 25%</div>
  <div>• Single assignment: IT subcommittee: 100%</div>
</div>
<div className="mt-2 text-xs text-blue-600">
  💡 All members of selected subcommittees receive automatic email notifications
</div>
</div>import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaUsers, FaPlus, FaTrash, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle, FaCalculator } from 'react-icons/fa';
import ResolutionAssignmentService from '../services/resolutionAssignmentService';

const ResolutionAssignmentForm = () => {
const [resolutions, setResolutions] = useState([]);
const [subcommittees, setSubcommittees] = useState([]);
const [selectedResolution, setSelectedResolution] = useState(null);
const [assignments, setAssignments] = useState([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

useEffect(() => {
fetchData();
}, []);

const fetchData = async () => {
try {
const [resolutionsData, subcommitteesData] = await Promise.all([
ResolutionAssignmentService.getAllResolutions(),
        fetch(`${process.env.REACT_APP_BASE_URL}/sub-committees`, { credentials: 'include' }).then(res => res.json())
]);

// Filter resolutions that can be assigned
const assignableResolutions = resolutionsData.filter(r => 
['ASSIGNED', 'IN_PROGRESS'].includes(r.status)
);

setResolutions(assignableResolutions);
setSubcommittees(subcommitteesData);
} catch (error) {
console.error('Error fetching data:', error);
setError('Failed to load data');
} finally {
setLoading(false);
}
};

const handleResolutionSelect = (resolution) => {
setSelectedResolution(resolution);
setAssignments([{
id: Date.now(),
subcommitteeId: '',
contributionPercentage: 100
}]);
setError('');
setSuccess('');
};

const addAssignment = () => {
const remainingPercentage = getRemainingPercentage();
setAssignments(prev => [
...prev,
{
id: Date.now(),
subcommitteeId: '',
contributionPercentage: Math.max(0, remainingPercentage)
}
]);
};

const removeAssignment = (id) => {
if (assignments.length > 1) {
setAssignments(prev => prev.filter(assignment => assignment.id !== id));
}
};

const updateAssignment = (id, field, value) => {
setAssignments(prev =>
prev.map(assignment =>
assignment.id === id
? { ...assignment, [field]: value }
: assignment
)
);
setError(''); // Clear errors when user makes changes
};

const getRemainingPercentage = () => {
return ResolutionAssignmentService.calculateRemainingPercentage(assignments);
};

const getTotalPercentage = () => {
return assignments.reduce((sum, assignment) => {
return sum + parseInt(assignment.contributionPercentage || 0);
}, 0);
};

const isValidAssignment = () => {
const validationErrors = ResolutionAssignmentService.validateAssignments(assignments);
return validationErrors.length === 0;
};

const getValidationErrors = () => {
return ResolutionAssignmentService.validateAssignments(assignments);
};

const handleSave = async () => {
if (!selectedResolution) {
setError('Please select a resolution first');
return;
}

const validationErrors = getValidationErrors();
if (validationErrors.length > 0) {
setError(validationErrors.join('. '));
return;
}

setSaving(true);
setError('');
setSuccess('');

try {
// Prepare assignments data for API
const assignmentData = assignments.map(assignment => ({
subcommitteeId: parseInt(assignment.subcommitteeId),
contributionPercentage: parseInt(assignment.contributionPercentage)
}));

await ResolutionAssignmentService.assignResolution(
selectedResolution.id, 
assignmentData
);

setSuccess('Resolution assigned successfully!');

// Reset form after success
setTimeout(() => {
setSelectedResolution(null);
setAssignments([]);
setSuccess('');
fetchData(); // Refresh data
}, 2000);

} catch (error) {
console.error('Error saving assignments:', error);
setError(error.message || 'Failed to save assignments. Please try again.');
} finally {
setSaving(false);
}
};

const handleAutoDistribute = () => {
if (assignments.length === 0) return;

const percentagePerAssignment = Math.floor(100 / assignments.length);
const remainder = 100 % assignments.length;

const updatedAssignments = assignments.map((assignment, index) => ({
...assignment,
contributionPercentage: percentagePerAssignment + (index < remainder ? 1 : 0)
}));

setAssignments(updatedAssignments);
};

const getSubcommitteeName = (id) => {
const sub = subcommittees.find(s => s.id === parseInt(id));
return sub?.name || 'Unknown';
};

const formatDate = (dateString) => {
return new Date(dateString).toLocaleDateString('en-US', {
year: 'numeric',
month: 'short',
day: 'numeric'
});
};

if (loading) {
return (
<div className="min-h-screen flex items-center justify-center">
<div className="text-center">
<FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
<p className="text-gray-600">Loading resolutions...</p>
</div>
</div>
);
}

const totalPercentage = getTotalPercentage();
const remainingPercentage = getRemainingPercentage();
const isValid = isValidAssignment();

return (
<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
<div className="max-w-6xl mx-auto">
<div className="mb-8">
<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
<FaFileAlt className="text-blue-600" />
Resolution Assignment
</h1>
<p className="mt-2 text-gray-600">
Assign resolutions to subcommittees with contribution percentages. 
All members of selected subcommittees will be automatically notified via email.
</p>
</div>

{/* Alert Messages */}
{error && (
<div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
<FaExclamationTriangle />
<span>{error}</span>
</div>
)}

{success && (
<div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
<FaCheck />
<span>{success}</span>
</div>
)}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
{/* Resolution Selection */}
<div className="bg-white shadow rounded-lg">
<div className="px-6 py-4 border-b border-gray-200">
<h2 className="text-xl font-semibold text-gray-900">Select Resolution</h2>
<p className="text-sm text-gray-600">
Choose a resolution to assign to multiple subcommittees with specific contribution percentages
</p>
</div>

<div className="p-6">
{resolutions.length === 0 ? (
<div className="text-center py-12">
<FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
<h3 className="mt-2 text-sm font-medium text-gray-900">No Resolutions Available</h3>
<p className="mt-1 text-sm text-gray-500">No resolutions are available for assignment.</p>
</div>
) : (
<div className="space-y-4 max-h-96 overflow-y-auto">
{resolutions.map(resolution => (
  <div
    key={resolution.id}
    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
      selectedResolution?.id === resolution.id
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300'
    }`}
    onClick={() => handleResolutionSelect(resolution)}
  >
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{resolution.title}</h4>
        <p className="text-sm text-gray-600 mt-1">{resolution.description}</p>
        {resolution.meeting && (
          <p className="text-xs text-gray-500 mt-2">
            From: {resolution.meeting.title} ({formatDate(resolution.meeting.meetingDate)})
          </p>
        )}
      </div>
      <span
        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
        style={{ backgroundColor: ResolutionAssignmentService.getStatusColor(resolution.status) }}
      >
        {resolution.status.replace('_', ' ')}
      </span>
    </div>
  </div>
))}
</div>
)}
</div>
</div>

{/* Assignment Form */}
{selectedResolution && (
<div className="bg-white shadow rounded-lg">
<div className="px-6 py-4 border-b border-gray-200">
<div className="flex justify-between items-start">
<div>
  <h2 className="text-xl font-semibold text-gray-900">Assignment Details</h2>
  <p className="text-sm text-gray-600">Assign: {selectedResolution.title}</p>
</div>
<button
  onClick={addAssignment}
  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
  disabled={saving}
>
  <FaPlus /> Add Assignment
</button>
</div>
</div>

<div className="p-6">
{/* Percentage Summary */}
<div className={`mb-6 p-4 rounded-lg ${
totalPercentage === 100 
  ? 'bg-green-50 border border-green-200' 
  : totalPercentage > 100
  ? 'bg-red-50 border border-red-200'
  : 'bg-yellow-50 border border-yellow-200'
}`}>
<div className="flex justify-between items-center mb-2">
  <span className="font-medium">Total Percentage:</span>
  <span className={`text-lg font-bold ${
    totalPercentage === 100 ? 'text-green-600' : 
    totalPercentage > 100 ? 'text-red-600' : 'text-yellow-600'
  }`}>
    {totalPercentage}%
  </span>
</div>
<div className="w-full bg-gray-200 rounded-full h-2">
  <div
    className={`h-2 rounded-full transition-all ${
      totalPercentage === 100 ? 'bg-green-500' :
      totalPercentage > 100 ? 'bg-red-500' : 'bg-yellow-500'
    }`}
    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
  ></div>
</div>
{totalPercentage !== 100 && (
  <div className="flex justify-between items-center mt-2">
    <span className="text-sm text-gray-600">
      Remaining: {remainingPercentage}%
    </span>
    <button
      onClick={handleAutoDistribute}
      className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
      disabled={saving}
    >
      <FaCalculator /> Auto Distribute
    </button>
  </div>
)}
</div>

{/* Assignments List */}
<div className="space-y-4 mb-6">
{assignments.map((assignment, index) => (
  <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
    <div className="flex justify-between items-start mb-4">
      <h4 className="font-medium text-gray-900">Assignment {index + 1}</h4>
      {assignments.length > 1 && (
        <button
          onClick={() => removeAssignment(assignment.id)}
          className="text-red-600 hover:text-red-800"
          disabled={saving}
        >
          <FaTrash />
        </button>
      )}
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subcommittee *
        </label>
        <select
          value={assignment.subcommitteeId}
          onChange={(e) => updateAssignment(assignment.id, 'subcommitteeId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={saving}
          required
        >
          <option value="">Select Subcommittee</option>
          {subcommittees
            .filter(sub => !assignments.some(a => a.subcommitteeId === sub.id.toString() && a.id !== assignment.id))
            .map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contribution Percentage *
        </label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max="100"
            value={assignment.contributionPercentage}
            onChange={(e) => updateAssignment(assignment.id, 'contributionPercentage', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-8"
            disabled={saving}
            required
          />
          <span className="absolute right-3 top-2 text-gray-400">%</span>
        </div>
      </div>
    </div>

    {assignment.subcommitteeId && (
      <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
        <strong>Assigned to:</strong> {getSubcommitteeName(assignment.subcommitteeId)}
      </div>
    )}
  </div>
))}
</div>

{/* Validation Messages */}
{!isValid && assignments.length > 0 && (
<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
  <ul className="text-sm text-red-700 space-y-1">
    {getValidationErrors().map((error, index) => (
      <li key={index}>• {error}</li>
    ))}
  </ul>
</div>
)}

{/* Action Buttons */}
<div className="flex justify-end space-x-3">
<button
  onClick={() => setSelectedResolution(null)}
  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
  disabled={saving}
>
  Cancel
</button>
<button
  onClick={handleSave}
  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
  disabled={saving || !isValid || assignments.length === 0}
>
  {saving ? (
    <>
      <FaSpinner className="animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <FaCheck />
      Save Assignments
    </>
  )}
</button>
</div>
</div>
</div>
)}
</div>
</div>
</div>
);
};

export default ResolutionAssignmentForm;