/**
 * Clinical Templates Library
 * Browse and manage Norwegian clinical examination templates
 */

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { templatesAPI } from '../services/api'
import {
  FileText,
  Search,
  Star,
  StarOff,
  Eye,
  Copy,
  Filter,
  X,
  TrendingUp,
  Grid,
  List,
  BookOpen
} from 'lucide-react'

export default function Templates() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [selectedTemplate, setSelectedTemplate] = useState(null)

  // Fetch templates by category
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates-by-category', 'NO'],
    queryFn: () => templatesAPI.getByCategory('NO')
  })

  const categories = templatesData?.data?.categories || []

  // Favorite toggle mutation
  const favoriteMutation = useMutation({
    mutationFn: (templateId) => templatesAPI.toggleFavorite(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates-by-category'])
    }
  })

  // Increment usage mutation
  const usageMutation = useMutation({
    mutationFn: (templateId) => templatesAPI.incrementUsage(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates-by-category'])
    }
  })

  // Filter templates
  const getFilteredTemplates = () => {
    let allTemplates = []
    categories.forEach(category => {
      allTemplates = [...allTemplates, ...category.templates]
    })

    return allTemplates.filter(template => {
      const matchesSearch = !searchTerm ||
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = !selectedCategory || template.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }

  const filteredTemplates = getFilteredTemplates()

  // Get all unique categories
  const allCategories = categories.map(cat => cat.category)

  // Handle template selection
  const handleTemplateClick = (template) => {
    setSelectedTemplate(template)
    usageMutation.mutate(template.id)
  }

  const handleToggleFavorite = (template, e) => {
    e.stopPropagation()
    favoriteMutation.mutate(template.id)
  }

  const copyTemplate = (template) => {
    const content = `${template.name}\n\n${template.description || ''}\n\n${JSON.stringify(template.fields, null, 2)}`
    navigator.clipboard.writeText(content)
    alert('Template copied to clipboard!')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clinical Templates</h1>
              <p className="text-gray-600">
                Norwegian examination protocols and templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTemplates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTemplates.filter(t => t.is_favorite).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Most Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTemplates.reduce((max, t) => Math.max(max, t.usage_count || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{allCategories.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {allCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Display */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No templates found matching your criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-500 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {template.name}
                  </h3>
                </div>
                <button
                  onClick={(e) => handleToggleFavorite(template, e)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {template.is_favorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              {template.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {template.category}
                </span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  <span>{template.usage_count || 0} uses</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template.name}
                        </div>
                        {template.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {template.usage_count || 0} uses
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => handleToggleFavorite(template, e)}
                      className="p-1 hover:bg-gray-100 rounded mr-2"
                    >
                      {template.is_favorite ? (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-600">{selectedTemplate.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(selectedTemplate, e)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {selectedTemplate.is_favorite ? (
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => copyTemplate(selectedTemplate)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <Copy className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {selectedTemplate.description && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedTemplate.description}</p>
                </div>
              )}

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Template Fields</h4>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedTemplate.fields, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Language:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.language}</span>
                </div>
                <div>
                  <span className="text-gray-600">Usage Count:</span>
                  <span className="ml-2 font-medium">{selectedTemplate.usage_count || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedTemplate.created_at).toLocaleDateString('no-NO')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 font-medium">
                    {new Date(selectedTemplate.updated_at).toLocaleDateString('no-NO')}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => copyTemplate(selectedTemplate)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Copy Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
