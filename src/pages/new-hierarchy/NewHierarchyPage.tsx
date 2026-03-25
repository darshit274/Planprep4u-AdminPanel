import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, RotateCw, List, Grid3X3, ChevronRight } from 'lucide-react';
import newHierarchyService, { TestSeries, HierarchyCategory, NewTest } from '../../services/newHierarchyService';
import TestSeriesModal from '../../components/new-hierarchy/TestSeriesModal';
import CategoryModal from '../../components/new-hierarchy/CategoryModal';
import TestModal from '../../components/new-hierarchy/TestModal';
import QuestionModal from '../../components/new-hierarchy/QuestionModal';
import HierarchyBreadcrumb from '../../components/new-hierarchy/HierarchyBreadcrumb';
import TestSeriesCard from '../../components/new-hierarchy/TestSeriesCard';
import CategoryCard from '../../components/new-hierarchy/CategoryCard';
import TestCard from '../../components/new-hierarchy/TestCard';
import QuestionsList from '../../components/new-hierarchy/QuestionsList';
import EmptyState from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

type ViewMode = 'test-series' | 'categories' | 'tests' | 'questions';

interface NavigationState {
  testSeries?: TestSeries;
  level1Category?: HierarchyCategory;
  level2Category?: HierarchyCategory;
  level3Category?: HierarchyCategory;
  level4Category?: HierarchyCategory;
  test?: NewTest;
}

const NewHierarchyPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('test-series');
  const [navigationState, setNavigationState] = useState<NavigationState>({});
  const [isTestSeriesModalOpen, setIsTestSeriesModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');

  // Fetch test series
  const { data: testSeriesData, isLoading: isLoadingTestSeries, refetch: refetchTestSeries } = useQuery(
    ['newTestSeries'],
    () => newHierarchyService.getAllTestSeries(),
    {
      enabled: viewMode === 'test-series',
    }
  );

  // Fetch categories based on current navigation
  const { data: categoriesData, isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery(
    ['newCategories', navigationState.testSeries?.id, currentLevel, getCurrentParentId()],
    () => {
      if (!navigationState.testSeries?.id) return null;
      return newHierarchyService.getCategories(navigationState.testSeries.id, {
        level: currentLevel,
        parentId: getCurrentParentId(),
      });
    },
    {
      enabled: viewMode === 'categories' && !!navigationState.testSeries?.id,
    }
  );

  // Fetch tests for level 4 category
  const { data: testsData, isLoading: isLoadingTests, refetch: refetchTests } = useQuery(
    ['newTests', navigationState.level4Category?.id],
    () => {
      if (!navigationState.level4Category?.id) return null;
      return newHierarchyService.getTestsByCategory(navigationState.level4Category.id);
    },
    {
      enabled: viewMode === 'tests' && !!navigationState.level4Category?.id,
    }
  );

  // Fetch questions for test
  const { data: questionsData, isLoading: isLoadingQuestions, refetch: refetchQuestions } = useQuery(
    ['newQuestions', navigationState.test?.id],
    () => {
      if (!navigationState.test?.id) return null;
      return newHierarchyService.getQuestionsByTest(navigationState.test.id);
    },
    {
      enabled: viewMode === 'questions' && !!navigationState.test?.id,
    }
  );

  function getCurrentParentId(): number | undefined {
    switch (currentLevel) {
      case 1:
        return undefined;
      case 2:
        return navigationState.level1Category?.id;
      case 3:
        return navigationState.level2Category?.id;
      case 4:
        return navigationState.level3Category?.id;
      default:
        return undefined;
    }
  }

  const handleTestSeriesClick = (testSeries: TestSeries) => {
    setNavigationState({ testSeries });
    setViewMode('categories');
    setCurrentLevel(1);
  };

  const handleCategoryClick = (category: HierarchyCategory) => {
    const newState = { ...navigationState };
    
    switch (category.hierarchy_level) {
      case 1:
        newState.level1Category = category;
        delete newState.level2Category;
        delete newState.level3Category;
        delete newState.level4Category;
        delete newState.test;
        setCurrentLevel(2);
        setViewMode('categories');
        break;
      case 2:
        newState.level2Category = category;
        delete newState.level3Category;
        delete newState.level4Category;
        delete newState.test;
        setCurrentLevel(3);
        setViewMode('categories');
        break;
      case 3:
        newState.level3Category = category;
        delete newState.level4Category;
        delete newState.test;
        setCurrentLevel(4);
        setViewMode('categories');
        break;
      case 4:
        newState.level4Category = category;
        delete newState.test;
        setViewMode('tests');
        break;
    }
    
    setNavigationState(newState);
  };

  const handleTestClick = (test: NewTest) => {
    setNavigationState({ ...navigationState, test });
    setViewMode('questions');
  };

  const handleBreadcrumbClick = (level: string) => {
    const newState = { ...navigationState };
    
    switch (level) {
      case 'test-series':
        setNavigationState({});
        setViewMode('test-series');
        setCurrentLevel(1);
        break;
      case 'level1':
        delete newState.level2Category;
        delete newState.level3Category;
        delete newState.level4Category;
        delete newState.test;
        setNavigationState(newState);
        setViewMode('categories');
        setCurrentLevel(1);
        break;
      case 'level2':
        delete newState.level3Category;
        delete newState.level4Category;
        delete newState.test;
        setNavigationState(newState);
        setViewMode('categories');
        setCurrentLevel(2);
        break;
      case 'level3':
        delete newState.level4Category;
        delete newState.test;
        setNavigationState(newState);
        setViewMode('categories');
        setCurrentLevel(3);
        break;
      case 'level4':
        delete newState.test;
        setNavigationState(newState);
        setViewMode('tests');
        break;
    }
  };

  const handleCreateTestSeries = () => {
    setSelectedItem(null);
    setIsTestSeriesModalOpen(true);
  };

  const handleEditTestSeries = (testSeries: TestSeries) => {
    setSelectedItem(testSeries);
    setIsTestSeriesModalOpen(true);
  };

  const handleDeleteTestSeries = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this test series?')) {
      try {
        await newHierarchyService.deleteTestSeries(id);
        toast.success('Test series deleted successfully');
        refetchTestSeries();
      } catch (error) {
        toast.error('Failed to delete test series');
      }
    }
  };

  const handleCreateCategory = () => {
    setSelectedItem(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: HierarchyCategory) => {
    setSelectedItem(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await newHierarchyService.deleteCategory(id);
        toast.success('Category deleted successfully');
        refetchCategories();
      } catch (error) {
        toast.error('Failed to delete category');
      }
    }
  };

  const handleCreateTest = () => {
    setSelectedItem(null);
    setIsTestModalOpen(true);
  };

  const handleEditTest = (test: NewTest) => {
    setSelectedItem(test);
    setIsTestModalOpen(true);
  };

  const handleDeleteTest = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await newHierarchyService.deleteTest(id);
        toast.success('Test deleted successfully');
        refetchTests();
      } catch (error) {
        toast.error('Failed to delete test');
      }
    }
  };

  const handleCreateQuestion = () => {
    setSelectedItem(null);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: any) => {
    setSelectedItem(question);
    setIsQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await newHierarchyService.deleteQuestion(id);
        toast.success('Question deleted successfully');
        refetchQuestions();
      } catch (error) {
        toast.error('Failed to delete question');
      }
    }
  };

  const getCategoryLevelName = (level: number) => {
    switch (level) {
      case 1:
        return 'Category';
      case 2:
        return 'Sub-category';
      case 3:
        return 'Sub-category';
      case 4:
        return 'Sub-category';
      default:
        return 'Category';
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'test-series':
        if (isLoadingTestSeries) return <LoadingSpinner />;
        if (!testSeriesData?.data?.length) {
          return (
            <EmptyState
              icon={<List className="w-16 h-16" />}
              title="No Test Series Found"
              description="Start by creating your first test series"
              action={{
                label: 'Create Test Series',
                onClick: handleCreateTestSeries,
              }}
            />
          );
        }
        return (
          <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {testSeriesData.data.map((series: TestSeries) => (
              <TestSeriesCard
                key={series.id}
                testSeries={series}
                viewType={viewType}
                onClick={() => handleTestSeriesClick(series)}
                onEdit={() => handleEditTestSeries(series)}
                onDelete={() => handleDeleteTestSeries(series.id)}
              />
            ))}
          </div>
        );

      case 'categories':
        if (isLoadingCategories) return <LoadingSpinner />;
        if (!categoriesData?.data?.length) {
          return (
            <EmptyState
              icon={<List className="w-16 h-16" />}
              title={`No ${getCategoryLevelName(currentLevel)}s Found`}
              description={`Create your first ${getCategoryLevelName(currentLevel).toLowerCase()}`}
              action={{
                label: `Create ${getCategoryLevelName(currentLevel)}`,
                onClick: handleCreateCategory,
              }}
            />
          );
        }
        return (
          <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {categoriesData.data.map((category: HierarchyCategory) => (
              <CategoryCard
                key={category.id}
                category={category}
                viewType={viewType}
                onClick={() => handleCategoryClick(category)}
                onEdit={() => handleEditCategory(category)}
                onDelete={() => handleDeleteCategory(category.id)}
              />
            ))}
          </div>
        );

      case 'tests':
        if (isLoadingTests) return <LoadingSpinner />;
        if (!testsData?.data?.length) {
          return (
            <EmptyState
              icon={<List className="w-16 h-16" />}
              title="No Tests Found"
              description="Create your first test in this category"
              action={{
                label: 'Create Test',
                onClick: handleCreateTest,
              }}
            />
          );
        }
        return (
          <div className={viewType === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {testsData.data.map((test: NewTest) => (
              <TestCard
                key={test.id}
                test={test}
                viewType={viewType}
                onClick={() => handleTestClick(test)}
                onEdit={() => handleEditTest(test)}
                onDelete={() => handleDeleteTest(test.id)}
              />
            ))}
          </div>
        );

      case 'questions':
        if (isLoadingQuestions) return <LoadingSpinner />;
        return (
          <QuestionsList
            questions={questionsData?.data || []}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
            onCreateQuestion={handleCreateQuestion}
          />
        );

      default:
        return null;
    }
  };

  const getCreateButtonLabel = () => {
    switch (viewMode) {
      case 'test-series':
        return 'Create Test Series';
      case 'categories':
        return `Create ${getCategoryLevelName(currentLevel)}`;
      case 'tests':
        return 'Create Test';
      case 'questions':
        return 'Create Question';
      default:
        return 'Create';
    }
  };

  const handleCreateClick = () => {
    switch (viewMode) {
      case 'test-series':
        handleCreateTestSeries();
        break;
      case 'categories':
        handleCreateCategory();
        break;
      case 'tests':
        handleCreateTest();
        break;
      case 'questions':
        handleCreateQuestion();
        break;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Test Management - 4 Level Hierarchy</h1>
        <p className="text-gray-600 mt-1">Manage your test series with dynamic categories</p>
      </div>

      <HierarchyBreadcrumb
        navigationState={navigationState}
        currentLevel={currentLevel}
        viewMode={viewMode}
        onNavigate={handleBreadcrumbClick}
      />

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleCreateClick}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Plus />
            <span>{getCreateButtonLabel()}</span>
          </button>
          <button
            onClick={() => {
              switch (viewMode) {
                case 'test-series':
                  refetchTestSeries();
                  break;
                case 'categories':
                  refetchCategories();
                  break;
                case 'tests':
                  refetchTests();
                  break;
                case 'questions':
                  refetchQuestions();
                  break;
              }
            }}
            className="text-gray-600 hover:text-gray-900"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {viewMode !== 'questions' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewType('grid')}
              className={`p-2 rounded ${viewType === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-2 rounded ${viewType === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {renderContent()}

      {/* Modals */}
      <TestSeriesModal
        isOpen={isTestSeriesModalOpen}
        onClose={() => {
          setIsTestSeriesModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          setIsTestSeriesModalOpen(false);
          setSelectedItem(null);
          refetchTestSeries();
        }}
        testSeries={selectedItem}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          setIsCategoryModalOpen(false);
          setSelectedItem(null);
          refetchCategories();
        }}
        category={selectedItem}
        testSeriesId={navigationState.testSeries?.id!}
        parentId={getCurrentParentId()}
        level={currentLevel}
      />

      <TestModal
        isOpen={isTestModalOpen}
        onClose={() => {
          setIsTestModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          setIsTestModalOpen(false);
          setSelectedItem(null);
          refetchTests();
        }}
        test={selectedItem}
        categoryId={navigationState.level4Category?.id!}
        testSeriesId={navigationState.testSeries?.id!}
      />

      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={() => {
          setIsQuestionModalOpen(false);
          setSelectedItem(null);
          refetchQuestions();
        }}
        question={selectedItem}
        testId={navigationState.test?.id!}
        testSeriesId={navigationState.testSeries?.id!}
        categoryId={navigationState.level4Category?.id!}
      />
    </div>
  );
};

export default NewHierarchyPage;