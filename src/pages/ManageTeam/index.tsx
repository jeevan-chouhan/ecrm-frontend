import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layout,
  Button,
  Accordion,
  AccordionGroup,
  AccordionItem,
  AccordionLabel,
} from "../../components";
import {
  Eye,
  Plus,
  ChevronDown,
  Search,
  CloseCircle,
  UserMinus,
} from "../../assets";
import {
  COLORS,
  ROUTES,
  statusFilterOptions,
  mockTeamData,
  type TeamMember,
} from "../../constants";

const ManageTeam = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Filter logic
  const getFilteredMembers = (members: TeamMember[]) => {
    return members.filter((member) => {
      const matchesSearch = member.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const handleView = (member: TeamMember) => {
    navigate(`${ROUTES.MANAGE_TEAM}/${member.id}`);
  };

  const handleDeactivate = (member: TeamMember) => {
    console.log("Deactivate member:", member);
    // Add deactivation logic here
  };

  const handleAddMember = () => {
    console.log("Add new member");
    // Add new member modal logic here
  };

  return (
    <Layout userName="Admin" userRole="Abroad Agency">
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 min-h-[calc(100vh-140px)]">
        {/* Header */}
        <h1
          className="text-2xl font-semibold mb-6"
          style={{ color: COLORS.textDark }}
        >
          Manage Team
        </h1>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <div
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
              style={{ color: COLORS.textMuted }}
            >
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team member name..."
              className="block w-full rounded-lg pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:outline-none"
              style={{
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textDark,
                backgroundColor: COLORS.surface,
                fontFamily: "'Inter', sans-serif",
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                style={{ color: COLORS.textMuted }}
              >
                <CloseCircle className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg text-sm min-w-[200px] transition-all duration-200"
              style={{
                border: `1px solid ${COLORS.border}`,
                backgroundColor: COLORS.surface,
                color: COLORS.textDark,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <span>
                {
                  statusFilterOptions.find((opt) => opt.value === statusFilter)
                    ?.label
                }
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isStatusDropdownOpen ? "rotate-180" : ""
                }`}
                style={{ color: COLORS.textMuted }}
              />
            </button>

            {isStatusDropdownOpen && (
              <div
                className="absolute mt-1 w-full rounded-lg overflow-hidden"
                style={{
                  zIndex: 10,
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                {statusFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value);
                      setIsStatusDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-slate-50"
                    style={{
                      color:
                        statusFilter === option.value
                          ? COLORS.accent
                          : COLORS.textDark,
                      backgroundColor:
                        statusFilter === option.value
                          ? COLORS.surfaceHover
                          : "transparent",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Roles Section */}
        <div className="mb-6">
          <h2
            className="text-base font-medium mb-4"
            style={{ color: COLORS.textDark }}
          >
            Roles
          </h2>

          <AccordionGroup>
            {mockTeamData.map((roleGroup, index) => {
              const filteredMembers = getFilteredMembers(roleGroup.members);
              const activeMembers = filteredMembers.filter(
                (m) => m.status === "active"
              );

              return (
                <Accordion
                  key={roleGroup.role}
                  title={roleGroup.role}
                  count={roleGroup.members.length}
                  defaultExpanded={index === mockTeamData.length - 1}
                >
                  <AccordionLabel>Active {roleGroup.role}s</AccordionLabel>

                  {activeMembers.length > 0 ? (
                    <div className="space-y-1">
                      {activeMembers.map((member) => (
                        <AccordionItem
                          key={member.id}
                          actions={
                            <>
                              {/* View Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<Eye className="h-4 w-4" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(member);
                                }}
                                title="View"
                                rounded
                              />

                              {/* Deactivate Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<UserMinus className="h-4 w-4" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeactivate(member);
                                }}
                                title="Deactivate"
                                rounded
                                style={{ color: COLORS.error }}
                              />
                            </>
                          }
                        >
                          {member.memberId} {member.name}
                        </AccordionItem>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="text-sm py-2"
                      style={{ color: COLORS.textMuted }}
                    >
                      No active members found
                    </p>
                  )}
                </Accordion>
              );
            })}
          </AccordionGroup>
        </div>

        {/* Add Member Button */}
        <div className="flex justify-end">
          <Button
            variant="accent"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleAddMember}
          >
            Add member
          </Button>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isStatusDropdownOpen && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 5 }}
          onClick={() => setIsStatusDropdownOpen(false)}
        />
      )}
    </Layout>
  );
};

export default ManageTeam;
